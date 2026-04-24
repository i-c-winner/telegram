import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertUserDto {
  @IsInt()
  telegramId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}
