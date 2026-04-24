import { IsInt, IsNumberString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateClickPaymentDto {
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
  @IsUrl({ require_protocol: true })
  returnUrl?: string;
}
