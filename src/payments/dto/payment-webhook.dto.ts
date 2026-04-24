import { PaymentStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  @MaxLength(50)
  provider!: string;

  @IsString()
  @MaxLength(120)
  providerPaymentId!: string;

  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;

  @IsInt()
  telegramUserId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsString()
  planCode!: string;

  @IsNumberString()
  amount!: string;

  @IsString()
  @MaxLength(10)
  currency!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
