import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import {
  PayoutScheduleService,
  CreatePayoutScheduleDto,
  UpdatePayoutScheduleDto,
} from "./payout-schedule.service";

@Controller("payout-schedule")
export class PayoutScheduleController {
  constructor(
    private readonly payoutScheduleService: PayoutScheduleService
  ) {}

  /**
   * Get payout schedule for a business
   */
  @Get(":businessId")
  async getSchedule(@Param("businessId") businessId: string) {
    return await this.payoutScheduleService.getSchedule(businessId);
  }

  /**
   * Create or update payout schedule
   */
  @Post()
  async createOrUpdateSchedule(@Body() dto: CreatePayoutScheduleDto) {
    return await this.payoutScheduleService.createOrUpdateSchedule(dto);
  }

  /**
   * Update payout schedule
   */
  @Put(":businessId")
  async updateSchedule(
    @Param("businessId") businessId: string,
    @Body() dto: UpdatePayoutScheduleDto
  ) {
    return await this.payoutScheduleService.updateSchedule(businessId, dto);
  }

  /**
   * Process scheduled payout for a business (manual trigger)
   */
  @Post("process/:businessId")
  async processScheduledPayout(@Param("businessId") businessId: string) {
    return await this.payoutScheduleService.processScheduledPayout(businessId);
  }

  /**
   * Process all scheduled payouts (for cron job)
   */
  @Post("process-all")
  async processAllScheduledPayouts() {
    return await this.payoutScheduleService.processAllScheduledPayouts();
  }
}

