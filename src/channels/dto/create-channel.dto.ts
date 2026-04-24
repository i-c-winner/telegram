import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsInt()
  telegramChatId!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
