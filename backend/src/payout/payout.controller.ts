import { Controller, Post, Get, Body, Param, Query } from "@nestjs/common";
import { PayoutService, PayoutRequest } from "./payout.service";

@Controller("payout")
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  /**
   * Create a platform-collected payment (Swiggy/Zomato style)
   */
  @Post("create-platform-payment")
  async createPlatformPayment(
    @Body() body: { businessId: string; amount: number; currency?: string }
  ) {
    return await this.payoutService.createPlatformCollectedPayment({
      amount: body.amount,
      currency: body.currency || "usd",
      businessId: body.businessId,
    });
  }

  /**
   * Get pending balance for a business
   */
  @Get("balance/:businessId")
  async getBusinessBalance(@Param("businessId") businessId: string) {
    return await this.payoutService.getBusinessPendingBalance(businessId);
  }

  /**
   * Create a payout to a business
   */
  @Post("create")
  async createPayout(@Body() request: PayoutRequest) {
    return await this.payoutService.createPayout(request);
  }

  /**
   * Get payout history for a business
   */
  @Get("history/:businessId")
  async getPayoutHistory(@Param("businessId") businessId: string) {
    return await this.payoutService.getPayoutHistory(businessId);
  }

  /**
   * Process weekly payouts for all businesses
   */
  @Post("process-weekly")
  async processWeeklyPayouts() {
    return await this.payoutService.processWeeklyPayouts();
  }

  /**
   * Get platform balance overview
   */
  @Get("platform-balance")
  async getPlatformBalance() {
    return await this.payoutService.getPlatformBalance();
  }

  /**
   * Get all businesses with their pending balances
   */
  @Get("businesses-balances")
  async getBusinessesBalances() {
    // This would need to be implemented in the service
    // For now, return a placeholder
    return { message: "Business balances endpoint - to be implemented" };
  }
}
