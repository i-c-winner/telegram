import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ClickService } from '../payments/click/click.service';
import { ClickWebhookDto } from '../payments/dto/click-webhook.dto';
import { PaymentsService } from '../payments/payments.service';
import { PaymentWebhookDto } from '../payments/dto/payment-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly clickService: ClickService
  ) {}

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-webhook-secret') secret?: string
  ): Promise<{ ok: true; result: unknown }> {
    const result = await this.paymentsService.handleWebhook(dto, secret);
    return { ok: true, result };
  }

  @Post('payments/click')
  @HttpCode(HttpStatus.OK)
  async handleClickWebhook(
    @Body() dto: ClickWebhookDto,
    @Headers('x-click-signature') signature?: string
  ): Promise<{ ok: true; result: unknown }> {
    this.clickService.verifyWebhookSignature(dto, signature);
    const internalWebhook = this.clickService.mapWebhookToInternal(dto);
    const result = await this.paymentsService.handleTrustedWebhook(internalWebhook);
    return { ok: true, result };
  }
}
