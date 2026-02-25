import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { BankAccountService } from "./bank-account.service";
import { AddBankAccountDto } from "./dto/add-bank-account.dto";
import { SetDefaultBankDto } from "./dto/set-default-bank.dto";

@Controller("businesses/:id/bank-accounts")
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addBankAccount(
    @Param("id") businessId: string,
    @Body() dto: AddBankAccountDto
  ) {
    return await this.bankAccountService.addBankAccount(businessId, dto);
  }

  @Get()
  async getBankAccounts(@Param("id") businessId: string) {
    return await this.bankAccountService.getBankAccounts(businessId);
  }

  @Patch("default")
  async setDefaultBankAccount(
    @Param("id") businessId: string,
    @Body() dto: SetDefaultBankDto
  ) {
    return await this.bankAccountService.setDefaultBankAccount(
      businessId,
      dto.bankAccountId
    );
  }

  @Delete(":bankId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBankAccount(
    @Param("id") businessId: string,
    @Param("bankId") bankId: string
  ) {
    await this.bankAccountService.removeBankAccount(businessId, bankId);
    return { message: "Bank account removed successfully" };
  }
}
