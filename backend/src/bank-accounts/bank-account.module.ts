import { Module } from "@nestjs/common";
import { BankAccountController } from "./bank-account.controller";
import { BankAccountService } from "./bank-account.service";
import { PrismaModule } from "../prisma/prisma.module";
import { StripeModule } from "../stripe/stripe.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [PrismaModule, StripeModule, BusinessModule],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService],
})
export class BankAccountModule {}
