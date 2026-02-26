import { Module } from "@nestjs/common";
import { WebhookController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";
import { BusinessModule } from "../business/business.module";
import { PaymentModule } from "../payment/payment.module";
import { BankAccountModule } from "../bank-accounts/bank-account.module";
import { StripeExpressModule } from "../stripe-express/stripe-express.module";

@Module({
  imports: [
    BusinessModule,
    PaymentModule,
    BankAccountModule,
    StripeExpressModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}

