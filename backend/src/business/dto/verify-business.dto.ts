import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export enum BusinessType {
  COMPANY = "company",
  INDIVIDUAL = "individual",
}

export class RepresentativeInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsInt()
  @Min(1)
  @Max(31)
  dobDay: number;

  @IsInt()
  @Min(1)
  @Max(12)
  dobMonth: number;

  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  dobYear: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class BankInfoDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  routingNumber: string;

  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @IsString()
  @IsOptional()
  bankName?: string;
}

export class VerifyBusinessDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsOptional()
  taxId?: string;

  @ValidateNested()
  @Type(() => RepresentativeInfoDto)
  representativeInfo: RepresentativeInfoDto;

  @ValidateNested()
  @Type(() => BankInfoDto)
  bankInfo: BankInfoDto;
}
