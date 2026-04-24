import { IsBoolean, IsInt, IsNumberString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MaxLength(100)
  code!: string;

  @IsString()
  @MaxLength(255)
  title!: string;

  @IsNumberString()
  priceAmount!: string;

  @IsString()
  @MaxLength(10)
  currency!: string;

  @IsInt()
  @Min(1)
  durationDays!: number;

  @IsString()
  channelId!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
