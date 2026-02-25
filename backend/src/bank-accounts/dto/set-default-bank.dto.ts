import { IsString, IsNotEmpty } from "class-validator";

export class SetDefaultBankDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;
}

