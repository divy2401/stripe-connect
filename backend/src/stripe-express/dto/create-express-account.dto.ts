import { IsInt, IsEmail, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";

export class CreateExpressAccountDto {
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  userId: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
