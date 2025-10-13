import { Module, Global } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StripeService } from "./stripe.service";
import Stripe from "stripe";

@Global()
@Module({
  providers: [
    {
      provide: "STRIPE_CLIENT",
      useFactory: (configService: ConfigService) => {
        const secretKey = configService.get<string>("STRIPE_SECRET_KEY");
        if (!secretKey) {
          throw new Error(
            "STRIPE_SECRET_KEY is not defined in environment variables"
          );
        }
        return new Stripe(secretKey, {
          apiVersion: "2025-09-30.clover",
          typescript: true,
        });
      },
      inject: [ConfigService],
    },
    StripeService,
  ],
  exports: [StripeService, "STRIPE_CLIENT"],
})
export class StripeModule {}
