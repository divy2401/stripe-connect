import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
} from "class-validator";

export enum ChargeType {
  DESTINATION = "destination",
  DIRECT = "direct",
  PLATFORM_COLLECTED = "platform_collected", // New: Platform collects all, manages payouts
}

export class CreatePaymentIntentDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsNumber()
  @Min(50) // Minimum charge amount (50 cents)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string = "usd";

  @IsEnum(ChargeType)
  @IsOptional()
  chargeType?: ChargeType = ChargeType.DESTINATION;
}
