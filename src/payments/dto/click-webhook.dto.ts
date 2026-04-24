import { IsInt, IsISO8601, IsNotEmpty, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClickWebhookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  providerPaymentId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  eventId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status!: string;

  @IsInt()
  telegramUserId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsString()
  @MaxLength(120)
  planCode!: string;

  @IsNumberString()
  amount!: string;

  @IsString()
  @MaxLength(10)
  currency!: string;

  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
