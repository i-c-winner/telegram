import { Controller, Get, Param } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('user/:userId/active')
  findActiveByUser(@Param('userId') userId: string): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE
      },
      orderBy: { paidUntil: 'desc' }
    });
  }
}
