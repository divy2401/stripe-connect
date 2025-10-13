import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";
import { PaymentService } from "../payment/payment.service";
import Stripe from "stripe";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService,
    private readonly paymentService: PaymentService
  ) {}

  /**
   * Verify and construct webhook event
   */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    return this.stripe.constructWebhookEvent(payload, signature, webhookSecret);
  }

  /**
   * Handle webhook events
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Received webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case "account.updated":
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent
          );
          break;

        case "transfer.created":
          await this.handleTransferCreated(
            event.data.object as Stripe.Transfer
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Error handling webhook event: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Handle account.updated event
   */
  private async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    this.logger.log(`Account updated: ${account.id}`);

    try {
      // Update business status
      const status = account.charges_enabled ? "active" : "pending";
      await this.businessService.updateBusinessStatus(account.id, status);
      this.logger.log(
        `Updated business account ${account.id} status to: ${status}`
      );

      // Update verification status based on Stripe account requirements
      let verificationStatus = "IN_REVIEW";

      if (account.charges_enabled && account.payouts_enabled) {
        verificationStatus = "VERIFIED";
      } else if (account.requirements?.disabled_reason) {
        verificationStatus = "REJECTED";
      } else if (account.requirements?.currently_due?.length === 0) {
        verificationStatus = "VERIFIED";
      }

      await this.businessService.updateVerificationStatus(
        account.id,
        verificationStatus as any
      );
      this.logger.log(
        `Updated business account ${account.id} verification status to: ${verificationStatus}`
      );
    } catch (error) {
      this.logger.error(`Business not found for account ${account.id}`);
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    try {
      await this.paymentService.updatePaymentStatus(
        paymentIntent.id,
        "succeeded"
      );
      this.logger.log(
        `Updated payment ${paymentIntent.id} status to: succeeded`
      );
    } catch (error) {
      this.logger.error(`Payment not found: ${paymentIntent.id}`);
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    this.logger.log(`Payment intent failed: ${paymentIntent.id}`);

    try {
      await this.paymentService.updatePaymentStatus(paymentIntent.id, "failed");
      this.logger.log(`Updated payment ${paymentIntent.id} status to: failed`);
    } catch (error) {
      this.logger.error(`Payment not found: ${paymentIntent.id}`);
    }
  }

  /**
   * Handle transfer.created event
   */
  private async handleTransferCreated(
    transfer: Stripe.Transfer
  ): Promise<void> {
    this.logger.log(
      `Transfer created: ${transfer.id} to account ${transfer.destination}`
    );
    // Additional logic for transfer tracking can be added here
  }
}
