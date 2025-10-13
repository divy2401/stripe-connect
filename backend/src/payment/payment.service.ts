import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";
import {
  CreatePaymentIntentDto,
  ChargeType,
} from "./dto/create-payment-intent.dto";

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService
  ) {}

  /**
   * Create a payment intent for a business (supports both destination and direct charges)
   */
  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    // Get business
    const business = await this.businessService.getBusinessById(dto.businessId);

    if (business.stripeAccountStatus !== "active") {
      throw new BadRequestException(
        "Business Stripe account is not active yet"
      );
    }

    // Calculate platform fee (e.g., 10% of amount)
    const platformFeeAmount = Math.floor(dto.amount * 0.1);

    // Determine charge type
    const chargeType = dto.chargeType || ChargeType.DESTINATION;

    let paymentIntent;

    if (chargeType === ChargeType.DIRECT) {
      // Direct charges: Payment goes directly to connected account
      paymentIntent = await this.stripe.createDirectChargePaymentIntent({
        amount: dto.amount,
        currency: dto.currency || "usd",
        connectedAccountId: business.stripeAccountId,
        platformFeeAmount,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          chargeType: "direct",
        },
      });
    } else if (chargeType === ChargeType.PLATFORM_COLLECTED) {
      // Platform-collected charges: Platform receives all money, manages payouts separately
      paymentIntent = await this.stripe.getClient().paymentIntents.create({
        amount: dto.amount,
        currency: dto.currency || "usd",
        payment_method_types: ["card"],
        metadata: {
          businessId: business.id,
          businessName: business.name,
          chargeType: "platform_collected",
        },
      });
    } else {
      // Destination charges: Platform collects, then transfers to connected account
      paymentIntent = await this.stripe.createDestinationChargePaymentIntent({
        amount: dto.amount,
        currency: dto.currency || "usd",
        connectedAccountId: business.stripeAccountId,
        platformFeeAmount,
        metadata: {
          businessId: business.id,
          businessName: business.name,
          chargeType: "destination",
        },
      });
    }

    // Store payment record in database
    await this.prisma.payment.create({
      data: {
        businessId: business.id,
        stripePaymentIntent: paymentIntent.id,
        amount: dto.amount,
        currency: dto.currency || "usd",
        status: paymentIntent.status,
        platformFee:
          chargeType === ChargeType.PLATFORM_COLLECTED ? 0 : platformFeeAmount,
        chargeType: chargeType,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: dto.amount,
      currency: dto.currency || "usd",
      platformFee: platformFeeAmount,
      businessAmount: dto.amount - platformFeeAmount,
      chargeType,
    };
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentIntentId: string, status: string) {
    return await this.prisma.payment.update({
      where: { stripePaymentIntent: paymentIntentId },
      data: { status },
    });
  }

  /**
   * Get payment by payment intent ID
   */
  async getPaymentByIntentId(paymentIntentId: string) {
    return await this.prisma.payment.findUnique({
      where: { stripePaymentIntent: paymentIntentId },
    });
  }
}
