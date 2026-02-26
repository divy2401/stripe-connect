import { Module } from "@nestjs/common";
import { StripeExpressService } from "./stripe-express.service";
import { StripeExpressController } from "./stripe-express.controller";

@Module({
  controllers: [StripeExpressController],
  providers: [StripeExpressService],
  exports: [StripeExpressService],
})
export class StripeExpressModule {}
