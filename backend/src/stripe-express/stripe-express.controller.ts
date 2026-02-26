import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { StripeExpressService } from "./stripe-express.service";
import { CreateExpressAccountDto } from "./dto/create-express-account.dto";

@Controller("stripe/express")
export class StripeExpressController {
  constructor(private readonly stripeExpressService: StripeExpressService) {}

  @Post("account")
  @HttpCode(HttpStatus.CREATED)
  async createExpressAccount(@Body() dto: CreateExpressAccountDto) {
    return await this.stripeExpressService.createExpressAccount(
      dto.userId,
      dto.email
    );
  }

  @Post("account/:accountId/onboarding-link")
  @HttpCode(HttpStatus.OK)
  async generateOnboardingLink(@Param("accountId") accountId: string) {
    return await this.stripeExpressService.generateExpressOnboardingLink(
      accountId
    );
  }

  @Get("account/:accountId/status")
  async getAccountStatus(@Param("accountId") accountId: string) {
    return await this.stripeExpressService.getExpressAccountStatus(accountId);
  }

  @Post("account/:accountId/login-link")
  @HttpCode(HttpStatus.OK)
  async createLoginLink(@Param("accountId") accountId: string) {
    return await this.stripeExpressService.createExpressLoginLink(accountId);
  }
}
