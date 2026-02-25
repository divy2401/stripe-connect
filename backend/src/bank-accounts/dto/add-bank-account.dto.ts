import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class AddBankAccountDto {
  @IsString()
  @IsNotEmpty()
  externalAccountToken: string; // Token from Stripe (btok_... for test mode)
}

