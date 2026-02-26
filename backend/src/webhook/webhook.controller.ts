import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  RawBodyRequest,
} from "@nestjs/common";
import { Request } from "express";
import { WebhookService } from "./webhook.service";

@Controller("webhook")
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post("stripe/webhook")
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }
    try {
      const rawBody = request.rawBody as Buffer;
      const event = this.webhookService.constructEvent(
        rawBody,
        signature,
        "CONNECTED_ACCOUNT"
      );
      await this.webhookService.handleEvent(event);
      return { received: true };
    } catch (error) {
      console.error("Webhook error:", error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  @Post("connected-account")
  @HttpCode(HttpStatus.OK)
  async handleConnectedAccountWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }

    // https://3c2d-110-227-207-99.ngrok-free.app/webhook/connected-account
    try {
      // Get raw body (must be configured in main.ts with rawBody: true)
      const rawBody = request.rawBody as Buffer;

      // Construct the event
      const event = this.webhookService.constructEvent(
        rawBody,
        signature,
        "CONNECTED_ACCOUNT"
      );

      // Handle the event
      await this.webhookService.handleEvent(event);

      return { received: true };
    } catch (error) {
      console.error("Webhook error:", error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }

  @Post("platform-account")
  @HttpCode(HttpStatus.OK)
  async handlePlatformWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }

    // https://3c2d-110-227-207-99.ngrok-free.app/webhook/platform-account

    try {
      // Get raw body (must be configured in main.ts with rawBody: true)
      const rawBody = request.rawBody as Buffer;

      // Construct the event
      const event = this.webhookService.constructEvent(
        rawBody,
        signature,
        "PLATFORM_ACCOUNT"
      );

      // Handle the event
      await this.webhookService.handleEvent(event);

      return { received: true };
    } catch (error) {
      console.error("Webhook error:", error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
