import { Injectable, Inject } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  constructor(@Inject("STRIPE_CLIENT") private readonly stripe: Stripe) {}

  /**
   * Create an Express Connected Account (Stripe API only; caller persists to DB)
   */
  async createExpressAccount(params: {
    email: string;
  }): Promise<Stripe.Account> {
    const account = await this.stripe.accounts.create({
      type: "express",
      email: params.email,
      business_type: "individual",
    });
    return account;
  }

  /**
   * Generate account link for Express onboarding (redirect to Stripe-hosted flow)
   */
  async generateExpressOnboardingLink(
    accountId: string,
    options: { refreshUrl: string; returnUrl: string }
  ): Promise<Stripe.AccountLink> {
    const accountLink = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: options.refreshUrl,
      return_url: options.returnUrl,
      type: "account_onboarding",
    });
    return accountLink;
  }

  /**
   * Get Express account status (charges_enabled, payouts_enabled, details_submitted)
   */
  async getExpressAccountStatus(accountId: string): Promise<{
    account: Stripe.Account;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    onboardingComplete: boolean;
  }> {
    const account = await this.stripe.accounts.retrieve(accountId);
    const chargesEnabled = account.charges_enabled === true;
    const payoutsEnabled = account.payouts_enabled === true;
    const detailsSubmitted = account.details_submitted === true;
    const onboardingComplete = chargesEnabled && payoutsEnabled;
    return {
      account,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      onboardingComplete,
    };
  }

  /**
   * Create login link for Express account dashboard
   */
  async createExpressLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    return await this.stripe.accounts.createLoginLink(accountId);
  }

  /**
   * Create a Custom Connected Account
   */
  async createCustomAccount(params: {
    email: string;
    businessName: string;
  }): Promise<Stripe.Account> {
    const account = await this.stripe.accounts.create({
      type: "custom",
      country: "US",
      email: params.email,
      business_type: "company",
      business_profile: {
        name: params.businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // For demo purposes, we'll auto-accept TOS
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: "127.0.0.1",
      },
    });

    return account;
  }

  /**
   * Create a Payment Intent with destination charges
   */
  async createDestinationChargePaymentIntent(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    platformFeeAmount: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      payment_method_types: ["card"],
      metadata: params.metadata || {},
      // Destination charges: Platform collects, then transfers to connected account
      transfer_data: {
        destination: params.connectedAccountId,
      },
      application_fee_amount: params.platformFeeAmount,
    });

    return paymentIntent;
  }

  /**
   * Create a Payment Intent with direct charges
   */
  async createDirectChargePaymentIntent(params: {
    amount: number;
    currency: string;
    connectedAccountId: string;
    platformFeeAmount: number;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        payment_method_types: ["card"],
        metadata: params.metadata || {},
        application_fee_amount: params.platformFeeAmount,
        // Direct charges: Payment goes directly to connected account
        on_behalf_of: params.connectedAccountId,

        // setup_future_usage: "off_session", // parameter tells Stripe you intend to use this payment method for future charges without the customer being present.
      },
      {
        stripeAccount: params.connectedAccountId, // Charge directly to connected account
      }
    );

    return paymentIntent;
  }

  /**
   * Retrieve account balance
   */
  async getAccountBalance(connectedAccountId: string): Promise<Stripe.Balance> {
    const balance = await this.stripe.balance.retrieve({
      stripeAccount: connectedAccountId,
    });

    return balance;
  }

  /**
   * Retrieve account details
   */
  async getAccount(accountId: string): Promise<Stripe.Account> {
    return await this.stripe.accounts.retrieve(accountId);
  }

  /**
   * Update account with verification data
   */
  // async updateAccountVerification(
  //   accountId: string,
  //   params: {
  //     businessType: string;
  //     businessName: string;
  //     taxId?: string;
  //     representativeInfo: any;
  //     bankInfo: any;
  //   }
  // ): Promise<Stripe.Account> {
  //   const updateData: any = {
  //     business_type: params.businessType,
  //     tos_acceptance: {
  //       date: Math.floor(Date.now() / 1000),
  //       ip: "127.0.0.1", // In production, use actual IP
  //     },
  //   };

  //   // Add business information
  //   if (params.businessType === "company") {
  //     updateData.company = {
  //       name: params.businessName,
  //       tax_id: params.taxId,
  //     };
  //   }

  //   // Add individual/representative information
  //   updateData.individual = {
  //     first_name: params.representativeInfo.firstName,
  //     last_name: params.representativeInfo.lastName,
  //     dob: {
  //       day: params.representativeInfo.dobDay,
  //       month: params.representativeInfo.dobMonth,
  //       year: params.representativeInfo.dobYear,
  //     },
  //     email: params.representativeInfo.email,
  //     phone: params.representativeInfo.phone,
  //     address: {
  //       line1: params.representativeInfo.addressLine1,
  //       line2: params.representativeInfo.addressLine2,
  //       city: params.representativeInfo.city,
  //       state: params.representativeInfo.state,
  //       postal_code: params.representativeInfo.postalCode,
  //       country: params.representativeInfo.country,
  //     },
  //   };

  //   // Add external account (bank account)
  //   updateData.external_account = {
  //     object: "bank_account",
  //     country: "US",
  //     currency: "usd",
  //     account_number: params.bankInfo.accountNumber,
  //     routing_number: params.bankInfo.routingNumber,
  //   };

  //   // Request capabilities
  //   updateData.capabilities = {
  //     transfers: { requested: true },
  //     card_payments: { requested: true },
  //   };

  //   return await this.stripe.accounts.update(accountId, updateData);
  // }

  async updateAccountVerification(
    accountId: string,
    params: {
      businessType: "individual" | "company";
      businessName: string;
      taxId?: string;
      representativeInfo: any;
      bankInfo: any;
    }
  ): Promise<Stripe.Account> {
    const updateData: any = {
      business_type: params.businessType,
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: "127.0.0.1", // In production, use actual IP
      },
      external_account: {
        object: "bank_account",
        country: "US",
        currency: "usd",
        account_number: params.bankInfo.accountNumber,
        routing_number: params.bankInfo.routingNumber,
      },
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    };

    if (params.businessType === "company") {
      updateData.company = {
        name: params.businessName,
        tax_id: params.taxId,
        address: {
          line1: params.representativeInfo.addressLine1,
          line2: params.representativeInfo.addressLine2,
          city: params.representativeInfo.city,
          state: params.representativeInfo.state,
          postal_code: params.representativeInfo.postalCode,
          country: params.representativeInfo.country,
        },
      };

      // Optional: include company representative
      updateData.company.directors_provided = true;
      updateData.company.executives_provided = true;
      updateData.company.owners_provided = true;
    } else if (params.businessType === "individual") {
      updateData.individual = {
        first_name: params.representativeInfo.firstName,
        last_name: params.representativeInfo.lastName,
        dob: {
          day: params.representativeInfo.dobDay,
          month: params.representativeInfo.dobMonth,
          year: params.representativeInfo.dobYear,
        },
        email: params.representativeInfo.email,
        phone: params.representativeInfo.phone,
        address: {
          line1: params.representativeInfo.addressLine1,
          line2: params.representativeInfo.addressLine2,
          city: params.representativeInfo.city,
          state: params.representativeInfo.state,
          postal_code: params.representativeInfo.postalCode,
          country: params.representativeInfo.country,
        },
      };
    }

    return await this.stripe.accounts.update(accountId, updateData);
  }

  /**
   * Construct webhook event
   */
  constructWebhookEvent(
    payload: Buffer | string,
    signature: string,
    webhookSecret: string
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  }

  /**
   * Create embedded onboarding session for Accounts v2
   * Note: Stripe's embedded onboarding always requires login for security reasons
   */
  async createEmbeddedOnboardingSession(
    accountId: string
  ): Promise<Stripe.AccountSession> {
    const session = await this.stripe.accountSessions.create({
      account: accountId,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true, // Collect bank account
            disable_stripe_user_authentication: true, // Disable Stripe user authentication
          },
        },
      },
    });

    return session;
  }

  /**
   * Add external account (bank account) to a connected account
   */
  async addExternalAccount(
    accountId: string,
    externalAccountToken: string
  ): Promise<Stripe.BankAccount | Stripe.Card> {
    const externalAccount = await this.stripe.accounts.createExternalAccount(
      accountId,
      {
        external_account: externalAccountToken,
      }
    );

    return externalAccount;
  }

  /**
   * Set default external account for a connected account
   * Note: Stripe automatically unsets the previous default when setting a new one
   */
  async setDefaultExternalAccount(
    accountId: string,
    externalAccountId: string
  ): Promise<Stripe.BankAccount | Stripe.Card> {
    // Stripe automatically handles unsetting the previous default
    // when you set a new account as default
    return await this.stripe.accounts.updateExternalAccount(
      accountId,
      externalAccountId,
      {
        default_for_currency: true,
      }
    );
  }

  /**
   * Delete external account from a connected account
   */
  async deleteExternalAccount(
    accountId: string,
    externalAccountId: string
  ): Promise<Stripe.Response<Stripe.DeletedExternalAccount>> {
    return await this.stripe.accounts.deleteExternalAccount(
      accountId,
      externalAccountId
    );
  }

  /**
   * Get all external accounts for a connected account
   */
  async getExternalAccounts(
    accountId: string
  ): Promise<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>> {
    return await this.stripe.accounts.listExternalAccounts(accountId, {
      limit: 100,
    });
  }

  /**
   * Disable automatic payouts for a connected account
   * This prevents Stripe from automatically sending payouts daily
   */
  async disableAutomaticPayouts(accountId: string): Promise<Stripe.Account> {
    return await this.stripe.accounts.update(accountId, {
      settings: {
        payouts: {
          schedule: {
            interval: "manual" as const, // Set to manual to disable automatic payouts
          },
        },
      },
    });
  }

  /**
   * Enable automatic payouts for a connected account
   * Note: Only use this if you want Stripe to handle payouts automatically
   */
  async enableAutomaticPayouts(
    accountId: string,
    schedule: {
      delayDays?: number;
      interval?: "daily" | "weekly" | "monthly";
      weeklyAnchor?: string;
      monthlyAnchor?: number;
    }
  ): Promise<Stripe.Account> {
    const payoutSchedule: any = {};

    if (schedule.delayDays !== undefined) {
      payoutSchedule.delay_days = schedule.delayDays;
    }

    if (schedule.interval) {
      payoutSchedule.interval = schedule.interval;
    }

    if (schedule.weeklyAnchor) {
      payoutSchedule.weekly_anchor = schedule.weeklyAnchor;
    }

    if (schedule.monthlyAnchor !== undefined) {
      payoutSchedule.monthly_anchor = schedule.monthlyAnchor;
    }

    return await this.stripe.accounts.update(accountId, {
      settings: {
        payouts: {
          schedule: payoutSchedule,
        },
      },
    });
  }

  /**
   * Create a payout to a specific bank account
   * This is used when rotating between multiple bank accounts
   */
  async createPayoutToBankAccount(
    accountId: string,
    bankAccountId: string,
    amount: number,
    currency: string = "usd"
  ): Promise<Stripe.Payout> {
    // First, set the bank account as default temporarily
    await this.setDefaultExternalAccount(accountId, bankAccountId);

    // Create the payout (Stripe will use the default account)
    const payout = await this.stripe.payouts.create(
      {
        amount,
        currency,
      },
      {
        stripeAccount: accountId,
      }
    );

    return payout;
  }

  /**
   * Get Stripe client (for advanced usage)
   */
  getClient(): Stripe {
    return this.stripe;
  }
}
