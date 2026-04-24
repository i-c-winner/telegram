import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { CreateClickPaymentDto } from '../dto/create-click-payment.dto';
import { ClickWebhookDto } from '../dto/click-webhook.dto';
import { PaymentWebhookDto } from '../dto/payment-webhook.dto';
import { ClickCreatePaymentResult } from './click.types';

@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('CLICK_API_BASE_URL')?.trim() || 'https://api.example-click.uz';

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 10_000
    });
  }

  async createPayment(dto: CreateClickPaymentDto): Promise<ClickCreatePaymentResult> {
    const serviceId = this.requiredEnv('CLICK_SERVICE_ID');
    const merchantId = this.requiredEnv('CLICK_MERCHANT_ID');
    const merchantUserId = this.requiredEnv('CLICK_MERCHANT_USER_ID');
    const publicKey = this.requiredEnv('CLICK_PUBLIC_KEY');
    const secretKey = this.requiredEnv('CLICK_SECRET_KEY');

    const merchantTransactionId = `tg_${dto.telegramUserId}_${Date.now()}`;

    const payload = {
      service_id: serviceId,
      merchant_id: merchantId,
      merchant_user_id: merchantUserId,
      merchant_trans_id: merchantTransactionId,
      amount: dto.amount,
      currency: dto.currency,
      account: {
        telegram_user_id: dto.telegramUserId,
        plan_code: dto.planCode,
        username: dto.username
      },
      return_url: dto.returnUrl
    };

    const signature = this.signPayload(payload, secretKey);

    try {
      const response = await this.http.post('/payments/create', payload, {
        headers: {
          'X-API-KEY': publicKey,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        }
      });

      const raw = response.data as Record<string, unknown>;
      const paymentUrl = this.extractUrl(raw);
      const providerPaymentId = this.extractPaymentId(raw, merchantTransactionId);

      return {
        paymentUrl,
        providerPaymentId,
        raw
      };
    } catch (error) {
      this.logger.error(`Click createPayment failed: ${String(error)}`);
      throw new InternalServerErrorException(
        'Click payment request failed. Check CLICK_* config and adapt payload format to official docs.'
      );
    }
  }

  verifyWebhookSignature(payload: ClickWebhookDto, signatureHeader?: string): void {
    const secret = this.requiredEnv('CLICK_WEBHOOK_SECRET');
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing X-Click-Signature header');
    }

    const provided = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
    const expected = this.signPayload(payload, secret);

    if (!this.safeCompare(provided, expected)) {
      throw new UnauthorizedException('Invalid Click webhook signature');
    }
  }

  mapWebhookToInternal(dto: ClickWebhookDto): PaymentWebhookDto {
    return {
      provider: 'click',
      providerPaymentId: dto.providerPaymentId,
      idempotencyKey: dto.eventId ?? `click:${dto.providerPaymentId}:${dto.status}:${dto.paidAt ?? 'na'}`,
      telegramUserId: dto.telegramUserId,
      username: dto.username,
      planCode: dto.planCode,
      amount: dto.amount,
      currency: dto.currency,
      status: this.mapStatus(dto.status),
      paidAt: dto.paidAt,
      payload: dto as unknown as Record<string, unknown>
    };
  }

  private mapStatus(status: string): PaymentStatus {
    const normalized = status.trim().toLowerCase();

    if (['success', 'succeeded', 'paid', 'completed', '2'].includes(normalized)) {
      return PaymentStatus.SUCCEEDED;
    }

    if (['failed', 'error', 'rejected', '-1'].includes(normalized)) {
      return PaymentStatus.FAILED;
    }

    if (['canceled', 'cancelled', '4'].includes(normalized)) {
      return PaymentStatus.CANCELED;
    }

    return PaymentStatus.PENDING;
  }

  private extractUrl(raw: Record<string, unknown>): string {
    const candidates = [
      raw.payment_url,
      raw.pay_url,
      raw.url,
      (raw.data as Record<string, unknown> | undefined)?.payment_url,
      (raw.data as Record<string, unknown> | undefined)?.pay_url,
      (raw.result as Record<string, unknown> | undefined)?.payment_url
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        return value;
      }
    }

    throw new InternalServerErrorException(
      'Click response has no payment URL. Adjust ClickService.extractUrl() to provider response format.'
    );
  }

  private extractPaymentId(raw: Record<string, unknown>, fallback: string): string {
    const candidates = [
      raw.provider_payment_id,
      raw.payment_id,
      raw.transaction_id,
      (raw.data as Record<string, unknown> | undefined)?.transaction_id,
      (raw.data as Record<string, unknown> | undefined)?.payment_id
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return `${fallback}_${randomUUID()}`;
  }

  private signPayload(payload: unknown, secret: string): string {
    const data = this.stableStringify(payload);
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const body = keys
      .map((key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`)
      .join(',');

    return `{${body}}`;
  }

  private safeCompare(a: string, b: string): boolean {
    try {
      const left = Buffer.from(a, 'utf8');
      const right = Buffer.from(b, 'utf8');
      if (left.length !== right.length) {
        return false;
      }

      return timingSafeEqual(left, right);
    } catch {
      return false;
    }
  }

  private requiredEnv(name: string): string {
    const value = this.configService.get<string>(name)?.trim();
    if (!value) {
      throw new BadRequestException(`${name} is not configured`);
    }

    return value;
  }
}
