import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";

@Injectable()
export class StripeExpressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService
  ) {}

  /**
   * Create Express account on Stripe and persist to DB
   */
  async createExpressAccount(userId: number, email: string) {
    const existing = await this.prisma.stripeExpressAccount.findFirst({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        "Express account already exists for this user. Use onboarding link to continue."
      );
    }

    const account = await this.stripe.createExpressAccount({ email });

    const record = await this.prisma.stripeExpressAccount.create({
      data: {
        userId,
        email,
        stripeAccountId: account.id,
        onboardingCompleted: false,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      stripeAccountId: record.stripeAccountId,
      onboardingCompleted: record.onboardingCompleted,
    };
  }

  /**
   * Generate onboarding link and return URL for redirect
   */
  async generateExpressOnboardingLink(accountId: string) {
    const record = await this.prisma.stripeExpressAccount.findUnique({
      where: { stripeAccountId: accountId },
    });
    if (!record) {
      throw new NotFoundException("Express account not found");
    }

    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:5000");
    const refreshUrl = `${frontendUrl}/stripe/refresh`;
    const returnUrl = `${frontendUrl}/stripe/return`;

    const accountLink = await this.stripe.generateExpressOnboardingLink(
      accountId,
      { refreshUrl, returnUrl }
    );

    return { url: accountLink.url };
  }

  /**
   * Get Express account status from Stripe and sync onboardingCompleted in DB
   */
  async getExpressAccountStatus(accountId: string) {
    const record = await this.prisma.stripeExpressAccount.findUnique({
      where: { stripeAccountId: accountId },
    });
    if (!record) {
      throw new NotFoundException("Express account not found");
    }

    const status = await this.stripe.getExpressAccountStatus(accountId);

    if (status.onboardingComplete && !record.onboardingCompleted) {
      await this.prisma.stripeExpressAccount.update({
        where: { stripeAccountId: accountId },
        data: { onboardingCompleted: true },
      });
    }

    return {
      stripeAccountId: accountId,
      onboardingCompleted: status.onboardingComplete,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
    };
  }

  /**
   * Create login link for Express dashboard
   */
  async createExpressLoginLink(accountId: string) {
    const record = await this.prisma.stripeExpressAccount.findUnique({
      where: { stripeAccountId: accountId },
    });
    if (!record) {
      throw new NotFoundException("Express account not found");
    }

    const loginLink = await this.stripe.createExpressLoginLink(accountId);
    return { url: loginLink.url };
  }

  /**
   * Find Express account by Stripe account ID (for webhooks)
   */
  async findByStripeAccountId(stripeAccountId: string) {
    return this.prisma.stripeExpressAccount.findUnique({
      where: { stripeAccountId },
    });
  }

  /**
   * Mark Express account onboarding as completed (used by webhooks)
   */
  async setOnboardingCompleted(stripeAccountId: string) {
    return this.prisma.stripeExpressAccount.update({
      where: { stripeAccountId },
      data: { onboardingCompleted: true },
    });
  }
}
