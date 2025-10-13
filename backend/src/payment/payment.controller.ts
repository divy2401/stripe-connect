import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentIntentDto, ChargeType } from './dto/create-payment-intent.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() dto: CreatePaymentIntentDto) {
    return await this.paymentService.createPaymentIntent(dto);
  }

  @Post('create-destination-charge')
  async createDestinationCharge(@Body() dto: CreatePaymentIntentDto) {
    return await this.paymentService.createPaymentIntent({
      ...dto,
      chargeType: ChargeType.DESTINATION,
    });
  }

  @Post('create-direct-charge')
  async createDirectCharge(@Body() dto: CreatePaymentIntentDto) {
    return await this.paymentService.createPaymentIntent({
      ...dto,
      chargeType: ChargeType.DIRECT,
    });
  }
}

