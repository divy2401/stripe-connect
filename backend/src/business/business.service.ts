import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Business, VerificationStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { VerifyBusinessDto } from "./dto/verify-business.dto";

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService
  ) {}

  /**
   * Create a new business and Custom Connected Account
   */
  async createBusiness(dto: CreateBusinessDto): Promise<Business> {
    // Check if business with this email already exists
    const existingBusiness = await this.prisma.business.findUnique({
      where: { email: dto.email },
    });

    if (existingBusiness) {
      throw new ConflictException("Business with this email already exists");
    }

    // Create Custom Connected Account on Stripe
    const stripeAccount = await this.stripe.createCustomAccount({
      email: dto.email,
      businessName: dto.name,
    });

    // Save business to database
    const business = await this.prisma.business.create({
      data: {
        name: dto.name,
        email: dto.email,
        stripeAccountId: stripeAccount.id,
        stripeAccountStatus: stripeAccount.charges_enabled
          ? "active"
          : "pending",
      },
    });

    return business;
  }

  /**
   * Get business by ID
   */
  async getBusinessById(id: string): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return business;
  }

  /**
   * Get business by Stripe Account ID
   */
  async getBusinessByStripeAccountId(
    stripeAccountId: string
  ): Promise<Business> {
    const business = await this.prisma.business.findUnique({
      where: { stripeAccountId },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    return business;
  }

  /**
   * Get all businesses
   */
  async getAllBusinesses(): Promise<Business[]> {
    return await this.prisma.business.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get business balance from Stripe
   */
  async getBusinessBalance(id: string) {
    const business = await this.getBusinessById(id);
    const balance = await this.stripe.getAccountBalance(
      business.stripeAccountId
    );

    return {
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        stripeAccountId: business.stripeAccountId,
      },
      balance: {
        available: balance.available,
        pending: balance.pending,
      },
    };
  }

  /**
   * Update business Stripe account status
   */
  async updateBusinessStatus(
    stripeAccountId: string,
    status: string
  ): Promise<Business> {
    return await this.prisma.business.update({
      where: { stripeAccountId },
      data: { stripeAccountStatus: status },
    });
  }

  /**
   * Verify business with custom KYC data
   */
  async verifyBusiness(id: string, dto: VerifyBusinessDto): Promise<Business> {
    const business = await this.getBusinessById(id);

    // Update Stripe account with verification data
    await this.stripe.updateAccountVerification(business.stripeAccountId, {
      businessType: dto.businessType,
      businessName: dto.businessName,
      taxId: dto.taxId,
      representativeInfo: dto.representativeInfo,
      bankInfo: dto.bankInfo,
    });

    // Update business in database
    const updatedBusiness = await this.prisma.business.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.IN_REVIEW,
        representativeInfo: dto.representativeInfo as any,
        bankInfo: {
          accountNumberLast4: dto.bankInfo.accountNumber.slice(-4),
          routingNumber: dto.bankInfo.routingNumber,
          accountHolderName: dto.bankInfo.accountHolderName,
          bankName: dto.bankInfo.bankName,
        } as any,
      },
    });

    return updatedBusiness;
  }

  /**
   * Get verification status from Stripe
   */
  async getVerificationStatus(id: string) {
    const business = await this.getBusinessById(id);
    const account = await this.stripe.getAccount(business.stripeAccountId);

    return {
      business: {
        id: business.id,
        name: business.name,
        email: business.email,
        stripeAccountId: business.stripeAccountId,
      },
      verificationStatus: business.verificationStatus,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || [],
        disabled_reason: account.requirements?.disabled_reason,
      },
    };
  }

  /**
   * Update verification status
   */
  async updateVerificationStatus(
    stripeAccountId: string,
    status: VerificationStatus
  ): Promise<Business> {
    return await this.prisma.business.update({
      where: { stripeAccountId },
      data: { verificationStatus: status },
    });
  }

  /**
   * Create embedded onboarding session
   */
  async createEmbeddedOnboardingSession(
    id: string
  ): Promise<{ clientSecret: string }> {
    const business = await this.getBusinessById(id);

    // Update verification method to embedded onboarding
    await this.prisma.business.update({
      where: { id },
      data: { verificationMethod: "EMBEDDED_ONBOARDING" },
    });

    const session = await this.stripe.createEmbeddedOnboardingSession(
      business.stripeAccountId
    );

    return { clientSecret: session.client_secret };
  }

  /**
   * Update verification method
   */
  async updateVerificationMethod(
    id: string,
    method: "CUSTOM_FORM" | "EMBEDDED_ONBOARDING"
  ): Promise<Business> {
    return await this.prisma.business.update({
      where: { id },
      data: { verificationMethod: method },
    });
  }
}
