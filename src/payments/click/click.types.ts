import { PaymentStatus } from '@prisma/client';

export interface ClickCreatePaymentResult {
  paymentUrl: string;
  providerPaymentId: string;
  raw: unknown;
}

export interface ClickMappedWebhook {
  providerPaymentId: string;
  idempotencyKey: string;
  status: PaymentStatus;
}
