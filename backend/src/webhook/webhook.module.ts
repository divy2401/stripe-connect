import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { BusinessModule } from '../business/business.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [BusinessModule, PaymentModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}

