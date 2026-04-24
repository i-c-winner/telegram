import { Injectable } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelDto): Promise<Channel> {
    return this.prisma.channel.create({
      data: {
        title: dto.title,
        telegramChatId: BigInt(dto.telegramChatId),
        isActive: dto.isActive ?? true
      }
    });
  }

  async findAll(): Promise<Channel[]> {
    return this.prisma.channel.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdateChannelDto): Promise<Channel> {
    return this.prisma.channel.update({
      where: { id },
      data: {
        title: dto.title,
        telegramChatId: dto.telegramChatId ? BigInt(dto.telegramChatId) : undefined,
        isActive: dto.isActive
      }
    });
  }
}
