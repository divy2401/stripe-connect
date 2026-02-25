import { Module } from "@nestjs/common";
import { PayoutScheduleController } from "./payout-schedule.controller";
import { PayoutScheduleService } from "./payout-schedule.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StripeModule } from "../stripe/stripe.module";
import { BusinessModule } from "../business/business.module";
import { BankAccountModule } from "../bank-accounts/bank-account.module";
import { PayoutModule } from "../payout/payout.module";

@Module({
  imports: [
    PrismaModule,
    StripeModule,
    BusinessModule,
    BankAccountModule,
    PayoutModule,
  ],
  controllers: [PayoutScheduleController],
  providers: [PayoutScheduleService],
  exports: [PayoutScheduleService],
})
export class PayoutScheduleModule {}

