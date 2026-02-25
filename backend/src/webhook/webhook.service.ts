import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";
import { PaymentService } from "../payment/payment.service";
import { BankAccountService } from "../bank-accounts/bank-account.service";
import Stripe from "stripe";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService,
    private readonly paymentService: PaymentService,
    private readonly bankAccountService: BankAccountService
  ) {}

  /**
   * Verify and construct webhook event
   */
  constructEvent(
    payload: Buffer,
    signature: string,
    webhookSecretName: string
  ): Stripe.Event {
    const secretKeyName = `STRIPE_WEBHOOK_SECRET_${webhookSecretName}`;
    const webhookSecret = this.config.get<string>(secretKeyName);
    if (!webhookSecret) {
      throw new Error(`${secretKeyName} is not configured`);
    }

    return this.stripe.constructWebhookEvent(payload, signature, webhookSecret);
  }

  /**
   * Handle webhook events
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(
      `Received webhook event: ${event.type} (Account: ${event.account || "platform"})`
    );

    try {
      switch (event.type) {
        // platform account events
        case "transfer.created": // Occurs whenever a transfer is created.
          await this.handleTransferCreated(
            event.data.object as Stripe.Transfer
          );
          break;

        case "payment_intent.succeeded": // Occurs when a PaymentIntent has successfully completed payment.
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
            event.account // This tells us which account the event came from
          );
          break;

        case "payment_intent.payment_failed": // Occurs when a PaymentIntent has failed the attempt to create a payment method or a payment.
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
            event.account // This tells us which account the event came from
          );
          break;

        // connected account events
        case "account.updated": // Occurs whenever an account status or property has changed
          await this.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case "account.external_account.created": // Occurs whenever an external account is created.
          await this.handleExternalAccountCreated(
            event.data.object as Stripe.BankAccount | Stripe.Card,
            event.account
          );
          break;

        case "account.external_account.updated": // Occurs whenever an external account is updated.
          await this.handleExternalAccountUpdated(
            event.data.object as Stripe.BankAccount | Stripe.Card,
            event.account
          );
          break;

        case "account.external_account.deleted": // Occurs whenever an external account is deleted.
          await this.handleExternalAccountDeleted(
            event.data.object as Stripe.BankAccount | Stripe.Card,
            event.account
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
    paymentIntent: Stripe.PaymentIntent,
    accountId?: string
  ): Promise<void> {
    this.logger.log(
      `Payment intent succeeded: ${paymentIntent.id} (Account: ${accountId || "platform"})`
    );

    try {
      // For direct charges, the payment intent ID might be different from what we stored
      // We need to find the payment by matching the metadata or other criteria
      let payment = await this.paymentService.getPaymentByIntentId(
        paymentIntent.id
      );

      if (!payment && accountId) {
        // This might be a direct charge - try to find by connected account and amount
        payment = await this.paymentService.findPaymentByAccountAndAmount(
          accountId,
          paymentIntent.amount
        );

        // If still not found, try to find by metadata matching
        if (!payment && paymentIntent.metadata?.businessId) {
          payment = await this.paymentService.findPaymentByBusinessAndAmount(
            paymentIntent.metadata.businessId,
            paymentIntent.amount
          );
        }
      }

      if (payment) {
        await this.paymentService.updatePaymentStatus(
          payment.stripePaymentIntent,
          "succeeded"
        );
        this.logger.log(
          `Updated payment ${payment.stripePaymentIntent} status to: succeeded`
        );
      } else {
        this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
      }
    } catch (error) {
      this.logger.error(`Error updating payment status: ${error.message}`);
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
    accountId?: string
  ): Promise<void> {
    this.logger.log(
      `Payment intent failed: ${paymentIntent.id} (Account: ${accountId || "platform"})`
    );

    try {
      // For direct charges, the payment intent ID might be different from what we stored
      // We need to find the payment by matching the metadata or other criteria
      let payment = await this.paymentService.getPaymentByIntentId(
        paymentIntent.id
      );

      if (!payment && accountId) {
        // This might be a direct charge - try to find by connected account and amount
        payment = await this.paymentService.findPaymentByAccountAndAmount(
          accountId,
          paymentIntent.amount
        );

        // If still not found, try to find by metadata matching
        if (!payment && paymentIntent.metadata?.businessId) {
          payment = await this.paymentService.findPaymentByBusinessAndAmount(
            paymentIntent.metadata.businessId,
            paymentIntent.amount
          );
        }
      }

      if (payment) {
        await this.paymentService.updatePaymentStatus(
          payment.stripePaymentIntent,
          "failed"
        );
        this.logger.log(
          `Updated payment ${payment.stripePaymentIntent} status to: failed`
        );
      } else {
        this.logger.warn(`Payment not found for intent: ${paymentIntent.id}`);
      }
    } catch (error) {
      this.logger.error(`Error updating payment status: ${error.message}`);
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

  /**
   * Handle account.external_account.created event
   */
  private async handleExternalAccountCreated(
    externalAccount: Stripe.BankAccount | Stripe.Card,
    accountId?: string
  ): Promise<void> {
    this.logger.log(
      `External account created: ${externalAccount.id} (Account: ${accountId || "platform"})`
    );

    if (!accountId) {
      this.logger.warn("No account ID in external_account.created event");
      return;
    }

    try {
      const business =
        await this.businessService.getBusinessByStripeAccountId(accountId);
      await this.bankAccountService.syncBankAccountFromStripe(
        accountId,
        externalAccount.id,
        externalAccount
      );
      this.logger.log(
        `Synced bank account ${externalAccount.id} for business ${business.id}`
      );
    } catch (error) {
      this.logger.error(
        `Error syncing bank account: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Handle account.external_account.updated event
   */
  private async handleExternalAccountUpdated(
    externalAccount: Stripe.BankAccount | Stripe.Card,
    accountId?: string
  ): Promise<void> {
    this.logger.log(
      `External account updated: ${externalAccount.id} (Account: ${accountId || "platform"})`
    );

    if (!accountId) {
      this.logger.warn("No account ID in external_account.updated event");
      return;
    }

    try {
      await this.bankAccountService.syncBankAccountFromStripe(
        accountId,
        externalAccount.id,
        externalAccount
      );
      this.logger.log(`Updated bank account ${externalAccount.id}`);
    } catch (error) {
      this.logger.error(
        `Error updating bank account: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Handle account.external_account.deleted event
   */
  private async handleExternalAccountDeleted(
    externalAccount: Stripe.BankAccount | Stripe.Card,
    accountId?: string
  ): Promise<void> {
    this.logger.log(
      `External account deleted: ${externalAccount.id} (Account: ${accountId || "platform"})`
    );

    try {
      await this.bankAccountService.deleteBankAccountByExternalId(
        externalAccount.id
      );
      this.logger.log(
        `Deleted bank account ${externalAccount.id} from database`
      );
    } catch (error) {
      this.logger.error(
        `Error deleting bank account: ${error.message}`,
        error.stack
      );
    }
  }
}
