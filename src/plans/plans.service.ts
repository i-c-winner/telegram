import { Injectable } from '@nestjs/common';
import { Plan, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlanDto): Promise<Plan> {
    return this.prisma.plan.create({
      data: {
        code: dto.code,
        title: dto.title,
        priceAmount: new Prisma.Decimal(dto.priceAmount),
        currency: dto.currency,
        durationDays: dto.durationDays,
        channelId: dto.channelId,
        isActive: dto.isActive ?? true
      }
    });
  }

  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    return this.prisma.plan.update({
      where: { id },
      data: {
        code: dto.code,
        title: dto.title,
        priceAmount: dto.priceAmount ? new Prisma.Decimal(dto.priceAmount) : undefined,
        currency: dto.currency,
        durationDays: dto.durationDays,
        channelId: dto.channelId,
        isActive: dto.isActive
      }
    });
  }
}
