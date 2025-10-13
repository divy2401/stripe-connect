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

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() request: RawBodyRequest<Request>
  ) {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }

    try {
      // Get raw body (must be configured in main.ts with rawBody: true)
      const rawBody = request.rawBody as Buffer;

      // Construct the event
      const event = this.webhookService.constructEvent(rawBody, signature);

      // Handle the event
      await this.webhookService.handleEvent(event);

      return { received: true };
    } catch (error) {
      console.error("Webhook error:", error.message);
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}
