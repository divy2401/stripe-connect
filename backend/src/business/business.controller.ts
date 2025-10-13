import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { BusinessService } from "./business.service";
import { CreateBusinessDto } from "./dto/create-business.dto";
import { VerifyBusinessDto } from "./dto/verify-business.dto";

@Controller("businesses")
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  async createBusiness(@Body() dto: CreateBusinessDto) {
    return await this.businessService.createBusiness(dto);
  }

  @Get()
  async getAllBusinesses() {
    return await this.businessService.getAllBusinesses();
  }

  @Get(":id")
  async getBusinessById(@Param("id") id: string) {
    return await this.businessService.getBusinessById(id);
  }

  @Get(":id/balance")
  async getBusinessBalance(@Param("id") id: string) {
    return await this.businessService.getBusinessBalance(id);
  }

  @Post(":id/verify")
  async verifyBusiness(
    @Param("id") id: string,
    @Body() dto: VerifyBusinessDto
  ) {
    return await this.businessService.verifyBusiness(id, dto);
  }

  @Get(":id/verification-status")
  async getVerificationStatus(@Param("id") id: string) {
    return await this.businessService.getVerificationStatus(id);
  }

  @Post(":id/embedded-onboarding-link")
  async createEmbeddedOnboardingLink(@Param("id") id: string) {
    return await this.businessService.createEmbeddedOnboardingSession(id);
  }

  @Post(":id/verification-method")
  async updateVerificationMethod(
    @Param("id") id: string,
    @Body() body: { method: "CUSTOM_FORM" | "EMBEDDED_ONBOARDING" }
  ) {
    return await this.businessService.updateVerificationMethod(id, body.method);
  }
}
