import { Module } from "@nestjs/common";
import { PayoutController } from "./payout.controller";
import { PayoutService } from "./payout.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StripeModule } from "../stripe/stripe.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [PrismaModule, StripeModule, BusinessModule],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}
