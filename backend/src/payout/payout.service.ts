import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";

export interface PayoutRequest {
  businessId: string;
  amount?: number; // Optional: if not provided, payout all pending balance
  reason?: string;
}

export interface PayoutSchedule {
  businessId: string;
  scheduleType: "weekly" | "monthly" | "on_demand";
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
}

@Injectable()
export class PayoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService
  ) {}

  /**
   * Create a platform-collected payment (Swiggy/Zomato style)
   * Platform receives all money, no automatic transfer
   */
  async createPlatformCollectedPayment(params: {
    amount: number;
    currency: string;
    businessId: string;
    metadata?: Record<string, string>;
  }) {
    const business = await this.businessService.getBusinessById(
      params.businessId
    );

    if (business.stripeAccountStatus !== "active") {
      throw new BadRequestException(
        "Business Stripe account is not active yet"
      );
    }

    // Create payment intent on platform account (no transfer_data)
    const paymentIntent = await this.stripe.getClient().paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      payment_method_types: ["card"],
      metadata: {
        ...params.metadata,
        businessId: business.id,
        businessName: business.name,
        chargeType: "platform_collected",
      },
    });

    // Store payment record
    const payment = await this.prisma.payment.create({
      data: {
        businessId: business.id,
        stripePaymentIntent: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
        status: paymentIntent.status,
        platformFee: 0, // No fee deducted yet, will be calculated during payout
        chargeType: "platform_collected",
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount: params.amount,
      businessName: business.name,
    };
  }

  /**
   * Get pending balance for a business (amount owed to them)
   */
  async getBusinessPendingBalance(businessId: string): Promise<{
    totalCollected: number;
    totalPaidOut: number;
    pendingBalance: number;
    platformFee: number;
    netAmount: number;
  }> {
    const business = await this.businessService.getBusinessById(businessId);

    // Get all platform-collected payments for this business
    const payments = await this.prisma.payment.findMany({
      where: {
        businessId: business.id,
        chargeType: "platform_collected",
        status: "succeeded",
      },
    });

    // Get all payouts made to this business
    const payouts = await this.prisma.payout.findMany({
      where: {
        businessId: business.id,
        status: "succeeded",
      },
    });

    const totalCollected = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalPaidOut = payouts.reduce(
      (sum, payout) => sum + payout.amount,
      0
    );
    const pendingBalance = totalCollected - totalPaidOut;

    // Calculate platform fee (10% of pending balance)
    const platformFee = Math.floor(pendingBalance * 0.1);
    const netAmount = pendingBalance - platformFee;

    return {
      totalCollected,
      totalPaidOut,
      pendingBalance,
      platformFee,
      netAmount,
    };
  }

  /**
   * Create a payout to a business (manual or scheduled)
   */
  async createPayout(request: PayoutRequest): Promise<{
    payoutId: string;
    amount: number;
    status: string;
  }> {
    const business = await this.businessService.getBusinessById(
      request.businessId
    );
    const balance = await this.getBusinessPendingBalance(request.businessId);

    if (balance.netAmount <= 0) {
      throw new BadRequestException("No pending balance to payout");
    }

    const payoutAmount = request.amount || balance.netAmount;

    if (payoutAmount > balance.netAmount) {
      throw new BadRequestException("Payout amount exceeds pending balance");
    }

    // Create transfer to connected account
    const transfer = await this.stripe.getClient().transfers.create({
      amount: payoutAmount,
      currency: "usd",
      destination: business.stripeAccountId,
      metadata: {
        businessId: business.id,
        businessName: business.name,
        reason: request.reason || "Scheduled payout",
      },
    });

    // Store payout record
    const payout = await this.prisma.payout.create({
      data: {
        businessId: business.id,
        stripeTransferId: transfer.id,
        amount: payoutAmount,
        currency: "usd",
        status: "succeeded",
        reason: request.reason || "Scheduled payout",
      },
    });

    return {
      payoutId: payout.id,
      amount: payoutAmount,
      status: "succeeded",
    };
  }

  /**
   * Get payout history for a business
   */
  async getPayoutHistory(businessId: string) {
    const business = await this.businessService.getBusinessById(businessId);

    return await this.prisma.payout.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Process weekly payouts for all businesses
   */
  async processWeeklyPayouts(): Promise<{
    processed: number;
    totalAmount: number;
    results: Array<{ businessId: string; amount: number; status: string }>;
  }> {
    const businesses = await this.prisma.business.findMany({
      where: {
        stripeAccountStatus: "active",
      },
    });

    const results: Array<{
      businessId: string;
      amount: number;
      status: string;
    }> = [];

    let totalAmount = 0;

    for (const business of businesses) {
      try {
        const balance = await this.getBusinessPendingBalance(business.id);

        if (balance.netAmount > 0) {
          const payout = await this.createPayout({
            businessId: business.id,
            reason: "Weekly scheduled payout",
          });

          results.push({
            businessId: business.id,
            amount: payout.amount,
            status: "success",
          });

          totalAmount += payout.amount;
        }
      } catch (error) {
        results.push({
          businessId: business.id,
          amount: 0,
          status: `error: ${error.message}`,
        });
      }
    }

    return {
      processed: results.filter((r) => r.status === "success").length,
      totalAmount,
      results,
    };
  }

  /**
   * Get platform balance (total collected minus total paid out)
   */
  async getPlatformBalance(): Promise<{
    totalCollected: number;
    totalPaidOut: number;
    platformBalance: number;
    pendingPayouts: number;
  }> {
    // Get all platform-collected payments
    const payments = await this.prisma.payment.findMany({
      where: {
        chargeType: "platform_collected",
        status: "succeeded",
      },
    });

    // Get all payouts
    const payouts = await this.prisma.payout.findMany({
      where: {
        status: "succeeded",
      },
    });

    const totalCollected = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalPaidOut = payouts.reduce(
      (sum, payout) => sum + payout.amount,
      0
    );
    const platformBalance = totalCollected - totalPaidOut;

    // Calculate pending payouts (what we owe to businesses)
    const businesses = await this.prisma.business.findMany({
      where: {
        stripeAccountStatus: "active",
      },
    });

    let pendingPayouts = 0;
    for (const business of businesses) {
      const balance = await this.getBusinessPendingBalance(business.id);
      pendingPayouts += balance.netAmount;
    }

    return {
      totalCollected,
      totalPaidOut,
      platformBalance,
      pendingPayouts,
    };
  }
}
