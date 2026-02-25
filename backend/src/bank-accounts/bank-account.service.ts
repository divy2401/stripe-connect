import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";
import { AddBankAccountDto } from "./dto/add-bank-account.dto";
import Stripe from "stripe";

@Injectable()
export class BankAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService
  ) {}

  /**
   * Add a bank account to a business
   */
  async addBankAccount(
    businessId: string,
    dto: AddBankAccountDto
  ): Promise<any> {
    // Verify business exists
    const business = await this.businessService.getBusinessById(businessId);

    try {
      // Add external account to Stripe
      const externalAccount = await this.stripe.addExternalAccount(
        business.stripeAccountId,
        dto.externalAccountToken
      );

      // Extract bank account details
      const bankAccount = externalAccount as Stripe.BankAccount;
      const bankName = bankAccount.bank_name || "Unknown Bank";
      const last4 = bankAccount.last4;
      const status = bankAccount.status || "new";
      const currency = bankAccount.currency || "usd";

      // Check if this is the first bank account (set as default)
      const existingBanks = await this.prisma.bankAccount.findMany({
        where: { businessId },
      });

      const isDefault = existingBanks.length === 0;

      // If setting as default, unset other defaults
      if (isDefault) {
        await this.prisma.bankAccount.updateMany({
          where: { businessId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // Save to database
      const savedBankAccount = await this.prisma.bankAccount.create({
        data: {
          businessId,
          externalAccountId: bankAccount.id,
          bankName,
          last4,
          isDefault,
          currency,
          status,
        },
      });

      // If this is the default, update Stripe account
      if (isDefault) {
        await this.stripe.setDefaultExternalAccount(
          business.stripeAccountId,
          bankAccount.id
        );
      }

      return savedBankAccount;
    } catch (error) {
      if (error.code === "resource_already_exists") {
        throw new ConflictException("Bank account already exists");
      }
      throw new BadRequestException(
        `Failed to add bank account: ${error.message}`
      );
    }
  }

  /**
   * Get all bank accounts for a business
   */
  async getBankAccounts(businessId: string): Promise<any[]> {
    // Verify business exists
    await this.businessService.getBusinessById(businessId);

    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { businessId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return bankAccounts;
  }

  /**
   * Set a bank account as default
   */
  async setDefaultBankAccount(
    businessId: string,
    bankAccountId: string
  ): Promise<any> {
    // Verify business exists
    const business = await this.businessService.getBusinessById(businessId);

    // Verify bank account exists and belongs to business
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        businessId,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException("Bank account not found");
    }

    // Unset other defaults
    await this.prisma.bankAccount.updateMany({
      where: { businessId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    const updated = await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { isDefault: true },
    });

    // Update Stripe account
    await this.stripe.setDefaultExternalAccount(
      business.stripeAccountId,
      bankAccount.externalAccountId
    );

    return updated;
  }

  /**
   * Remove a bank account
   */
  async removeBankAccount(
    businessId: string,
    bankAccountId: string
  ): Promise<void> {
    // Verify business exists
    const business = await this.businessService.getBusinessById(businessId);

    // Verify bank account exists and belongs to business
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: bankAccountId,
        businessId,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException("Bank account not found");
    }

    // Prevent removing the last bank account if it's the only one
    const allBanks = await this.prisma.bankAccount.findMany({
      where: { businessId },
    });

    if (allBanks.length === 1) {
      throw new BadRequestException(
        "Cannot remove the last bank account. Please add another bank account first."
      );
    }

    try {
      // Delete from Stripe
      await this.stripe.deleteExternalAccount(
        business.stripeAccountId,
        bankAccount.externalAccountId
      );

      // Delete from database
      await this.prisma.bankAccount.delete({
        where: { id: bankAccountId },
      });

      // If the deleted account was default, set another as default
      if (bankAccount.isDefault && allBanks.length > 1) {
        const nextBank = allBanks.find((b) => b.id !== bankAccountId);
        if (nextBank) {
          await this.prisma.bankAccount.update({
            where: { id: nextBank.id },
            data: { isDefault: true },
          });
          // Update Stripe
          await this.stripe.setDefaultExternalAccount(
            business.stripeAccountId,
            nextBank.externalAccountId
          );
        }
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to remove bank account: ${error.message}`
      );
    }
  }

  /**
   * Sync bank account from Stripe webhook
   */
  async syncBankAccountFromStripe(
    stripeAccountId: string,
    externalAccountId: string,
    externalAccount: Stripe.BankAccount | Stripe.Card
  ): Promise<void> {
    if (externalAccount.object !== "bank_account") {
      return; // Only handle bank accounts
    }

    const bankAccount = externalAccount as Stripe.BankAccount;

    const existing = await this.prisma.bankAccount.findUnique({
      where: { externalAccountId },
    });

    const data = {
      bankName: bankAccount.bank_name || null,
      last4: bankAccount.last4,
      currency: bankAccount.currency || "usd",
      status: bankAccount.status || null,
    };

    if (existing) {
      // Update existing
      await this.prisma.bankAccount.update({
        where: { externalAccountId },
        data,
      });
    } else {
      // Create new
      const business =
        await this.businessService.getBusinessByStripeAccountId(
          stripeAccountId
        );
      const isDefault =
        (await this.prisma.bankAccount.count({
          where: { businessId: business.id },
        })) === 0;

      await this.prisma.bankAccount.create({
        data: {
          businessId: business.id,
          externalAccountId,
          ...data,
          isDefault,
        },
      });
    }
  }

  /**
   * Delete bank account from database (webhook)
   */
  async deleteBankAccountByExternalId(
    externalAccountId: string
  ): Promise<void> {
    await this.prisma.bankAccount.deleteMany({
      where: { externalAccountId },
    });
  }
}
