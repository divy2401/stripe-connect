import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StripeService } from "../stripe/stripe.service";
import { BusinessService } from "../business/business.service";
import { BankAccountService } from "../bank-accounts/bank-account.service";
import { PayoutService } from "../payout/payout.service";
import {
  PayoutScheduleType,
  PayoutRotationStrategy,
} from "@prisma/client";

export interface CreatePayoutScheduleDto {
  businessId: string;
  scheduleType: PayoutScheduleType;
  rotationStrategy: PayoutRotationStrategy;
  isEnabled: boolean;
  intervalDays?: number;
  specificDayOfWeek?: number;
  specificDayOfMonth?: number;
  minimumPayoutAmount?: number;
}

export interface UpdatePayoutScheduleDto {
  scheduleType?: PayoutScheduleType;
  rotationStrategy?: PayoutRotationStrategy;
  isEnabled?: boolean;
  intervalDays?: number;
  specificDayOfWeek?: number;
  specificDayOfMonth?: number;
  minimumPayoutAmount?: number;
}

@Injectable()
export class PayoutScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly businessService: BusinessService,
    private readonly bankAccountService: BankAccountService,
    private readonly payoutService: PayoutService
  ) {}

  /**
   * Create or update payout schedule for a business
   */
  async createOrUpdateSchedule(
    dto: CreatePayoutScheduleDto
  ): Promise<any> {
    const business = await this.businessService.getBusinessById(dto.businessId);

    // Verify business has bank accounts
    const bankAccounts = await this.bankAccountService.getBankAccounts(
      dto.businessId
    );
    if (bankAccounts.length === 0) {
      throw new BadRequestException(
        "Business must have at least one bank account to set up payout schedule"
      );
    }

    // Disable automatic Stripe payouts if requested
    if (dto.isEnabled) {
      await this.stripe.disableAutomaticPayouts(business.stripeAccountId);
    }

    // Calculate next payout date
    const nextPayoutDate = this.calculateNextPayoutDate(dto);

    const scheduleData = {
      scheduleType: dto.scheduleType,
      rotationStrategy: dto.rotationStrategy,
      isEnabled: dto.isEnabled,
      autoPayoutDisabled: dto.isEnabled,
      intervalDays: dto.intervalDays || null,
      specificDayOfWeek: dto.specificDayOfWeek ?? null,
      specificDayOfMonth: dto.specificDayOfMonth ?? null,
      minimumPayoutAmount: dto.minimumPayoutAmount || 1000,
      nextPayoutDate,
    };

    // Upsert schedule
    const schedule = await this.prisma.payoutSchedule.upsert({
      where: { businessId: dto.businessId },
      update: scheduleData,
      create: {
        businessId: dto.businessId,
        ...scheduleData,
      },
    });

    return schedule;
  }

  /**
   * Get payout schedule for a business
   */
  async getSchedule(businessId: string): Promise<any> {
    await this.businessService.getBusinessById(businessId);

    const schedule = await this.prisma.payoutSchedule.findUnique({
      where: { businessId },
    });

    return schedule;
  }

  /**
   * Update payout schedule
   */
  async updateSchedule(
    businessId: string,
    dto: UpdatePayoutScheduleDto
  ): Promise<any> {
    const schedule = await this.getSchedule(businessId);
    if (!schedule) {
      throw new NotFoundException("Payout schedule not found");
    }

    const updateData: any = {};

    if (dto.scheduleType !== undefined) {
      updateData.scheduleType = dto.scheduleType;
    }
    if (dto.rotationStrategy !== undefined) {
      updateData.rotationStrategy = dto.rotationStrategy;
    }
    if (dto.isEnabled !== undefined) {
      updateData.isEnabled = dto.isEnabled;
      updateData.autoPayoutDisabled = dto.isEnabled;
    }
    if (dto.intervalDays !== undefined) {
      updateData.intervalDays = dto.intervalDays;
    }
    if (dto.specificDayOfWeek !== undefined) {
      updateData.specificDayOfWeek = dto.specificDayOfWeek;
    }
    if (dto.specificDayOfMonth !== undefined) {
      updateData.specificDayOfMonth = dto.specificDayOfMonth;
    }
    if (dto.minimumPayoutAmount !== undefined) {
      updateData.minimumPayoutAmount = dto.minimumPayoutAmount;
    }

    // Recalculate next payout date if schedule changed
    if (Object.keys(updateData).length > 0) {
      const fullSchedule = { ...schedule, ...updateData };
      updateData.nextPayoutDate = this.calculateNextPayoutDate(fullSchedule);

      const business = await this.businessService.getBusinessById(businessId);
      if (updateData.isEnabled) {
        await this.stripe.disableAutomaticPayouts(business.stripeAccountId);
      }
    }

    return await this.prisma.payoutSchedule.update({
      where: { businessId },
      data: updateData,
    });
  }

  /**
   * Calculate next payout date based on schedule
   */
  private calculateNextPayoutDate(
    schedule: CreatePayoutScheduleDto | any
  ): Date | null {
    if (!schedule.isEnabled) {
      return null;
    }

    const now = new Date();
    const nextDate = new Date(now);

    switch (schedule.scheduleType) {
      case PayoutScheduleType.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0);
        break;

      case PayoutScheduleType.WEEKLY:
        const dayOfWeek = schedule.specificDayOfWeek ?? 1; // Default Monday
        const currentDayOfWeek = now.getDay();
        let daysUntilNext = dayOfWeek - currentDayOfWeek;
        if (daysUntilNext <= 0) {
          daysUntilNext += 7;
        }
        nextDate.setDate(nextDate.getDate() + daysUntilNext);
        nextDate.setHours(0, 0, 0, 0);
        break;

      case PayoutScheduleType.MONTHLY:
        const dayOfMonth = schedule.specificDayOfMonth ?? 1;
        nextDate.setDate(dayOfMonth);
        if (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        nextDate.setHours(0, 0, 0, 0);
        break;

      case PayoutScheduleType.CUSTOM:
        const intervalDays = schedule.intervalDays ?? 7;
        nextDate.setDate(nextDate.getDate() + intervalDays);
        nextDate.setHours(0, 0, 0, 0);
        break;

      case PayoutScheduleType.MANUAL:
      default:
        return null;
    }

    return nextDate;
  }

  /**
   * Get next bank account to use based on rotation strategy
   */
  async getNextBankAccount(
    businessId: string,
    schedule: any
  ): Promise<string> {
    const bankAccounts = await this.bankAccountService.getBankAccounts(
      businessId
    );

    if (bankAccounts.length === 0) {
      throw new BadRequestException("No bank accounts found");
    }

    if (bankAccounts.length === 1) {
      return bankAccounts[0].id;
    }

    switch (schedule.rotationStrategy) {
      case PayoutRotationStrategy.FIXED:
        // Use default bank account
        const defaultAccount = bankAccounts.find((ba) => ba.isDefault);
        return defaultAccount?.id || bankAccounts[0].id;

      case PayoutRotationStrategy.ROUND_ROBIN:
        // Round robin: cycle through accounts
        const lastUsedId = schedule.lastUsedBankAccountId;
        if (!lastUsedId) {
          return bankAccounts[0].id;
        }
        const lastIndex = bankAccounts.findIndex((ba) => ba.id === lastUsedId);
        const nextIndex = (lastIndex + 1) % bankAccounts.length;
        return bankAccounts[nextIndex].id;

      case PayoutRotationStrategy.ALTERNATE_MONTHLY:
        // Alternate monthly: use account based on month number
        const currentMonth = new Date().getMonth();
        const accountIndex = currentMonth % bankAccounts.length;
        return bankAccounts[accountIndex].id;

      case PayoutRotationStrategy.ALTERNATE_WEEKLY:
        // Alternate weekly: use account based on week number
        const weekNumber = this.getWeekNumber(new Date());
        const weeklyAccountIndex = weekNumber % bankAccounts.length;
        return bankAccounts[weeklyAccountIndex].id;

      default:
        return bankAccounts[0].id;
    }
  }

  /**
   * Process scheduled payouts for a business
   */
  async processScheduledPayout(businessId: string): Promise<any> {
    const schedule = await this.getSchedule(businessId);
    if (!schedule || !schedule.isEnabled) {
      return { message: "Payout schedule not enabled" };
    }

    // Check if it's time for payout
    const now = new Date();
    if (schedule.nextPayoutDate && schedule.nextPayoutDate > now) {
      return { message: "Not time for payout yet" };
    }

    // Check balance
    const balance = await this.payoutService.getBusinessPendingBalance(
      businessId
    );

    if (balance.netAmount < (schedule.minimumPayoutAmount || 1000)) {
      // Update next payout date and skip
      const nextDate = this.calculateNextPayoutDate(schedule);
      await this.prisma.payoutSchedule.update({
        where: { businessId },
        data: { nextPayoutDate: nextDate },
      });
      return {
        message: "Balance below minimum payout amount",
        balance: balance.netAmount,
        minimum: schedule.minimumPayoutAmount,
      };
    }

    // Get next bank account based on rotation
    const bankAccountId = await this.getNextBankAccount(businessId, schedule);
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });

    if (!bankAccount) {
      throw new NotFoundException("Bank account not found");
    }

    const business = await this.businessService.getBusinessById(businessId);

    // Create payout using Stripe
    try {
      const stripePayout = await this.stripe.createPayoutToBankAccount(
        business.stripeAccountId,
        bankAccount.externalAccountId,
        balance.netAmount,
        "usd"
      );

      // Record payout in database
      await this.prisma.payout.create({
        data: {
          businessId,
          bankAccountId,
          stripePayoutId: stripePayout.id,
          stripeTransferId: stripePayout.id, // For compatibility
          amount: balance.netAmount,
          currency: "usd",
          status: stripePayout.status,
          reason: `Scheduled payout (${schedule.scheduleType})`,
          isScheduled: true,
        },
      });

      // Update schedule
      const nextDate = this.calculateNextPayoutDate(schedule);
      await this.prisma.payoutSchedule.update({
        where: { businessId },
        data: {
          lastUsedBankAccountId: bankAccountId,
          rotationCounter: schedule.rotationCounter + 1,
          nextPayoutDate: nextDate,
          lastPayoutDate: new Date(),
        },
      });

      return {
        success: true,
        payoutId: stripePayout.id,
        amount: balance.netAmount,
        bankAccountId,
        nextPayoutDate: nextDate,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create payout: ${error.message}`
      );
    }
  }

  /**
   * Process all scheduled payouts (for cron job)
   */
  async processAllScheduledPayouts(): Promise<{
    processed: number;
    skipped: number;
    errors: number;
    results: any[];
  }> {
    const schedules = await this.prisma.payoutSchedule.findMany({
      where: {
        isEnabled: true,
        nextPayoutDate: {
          lte: new Date(),
        },
      },
    });

    const results: any[] = [];
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const schedule of schedules) {
      try {
        const result = await this.processScheduledPayout(schedule.businessId);
        results.push({
          businessId: schedule.businessId,
          ...result,
        });
        if (result.success) {
          processed++;
        } else {
          skipped++;
        }
      } catch (error: any) {
        errors++;
        results.push({
          businessId: schedule.businessId,
          error: error?.message || "Unknown error",
        });
      }
    }

    return { processed, skipped, errors, results };
  }

  /**
   * Get week number of the year
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}

