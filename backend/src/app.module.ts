import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { StripeModule } from "./stripe/stripe.module";
import { BusinessModule } from "./business/business.module";
import { PaymentModule } from "./payment/payment.module";
import { PayoutModule } from "./payout/payout.module";
import { WebhookModule } from "./webhook/webhook.module";
import { BankAccountModule } from "./bank-accounts/bank-account.module";
import { PayoutScheduleModule } from "./payout-schedule/payout-schedule.module";
import { StripeExpressModule } from "./stripe-express/stripe-express.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    StripeModule,
    BusinessModule,
    PaymentModule,
    PayoutModule,
    WebhookModule,
    BankAccountModule,
    PayoutScheduleModule,
    StripeExpressModule,
  ],
})
export class AppModule {}
