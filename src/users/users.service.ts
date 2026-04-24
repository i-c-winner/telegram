import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertUserDto } from './dto/upsert-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: UpsertUserDto): Promise<User> {
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(dto.telegramId) },
      update: {
        username: dto.username,
        language: dto.language
      },
      create: {
        telegramId: BigInt(dto.telegramId),
        username: dto.username,
        language: dto.language ?? 'ru'
      }
    });
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });
  }

  async updateLanguageByTelegramId(telegramId: number, language: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: { language },
      create: {
        telegramId: BigInt(telegramId),
        language
      }
    });
  }
}
