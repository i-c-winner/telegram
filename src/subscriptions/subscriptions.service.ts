import { Injectable, Logger } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelAccessService } from '../channel-access/channel-access.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelAccessService: ChannelAccessService
  ) {}

  async findExpiredActiveSubscriptions(now: Date, limit = 100): Promise<Subscription[]> {
    return this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        paidUntil: { lte: now }
      },
      orderBy: { paidUntil: 'asc' },
      take: limit
    });
  }

  async expireSubscription(subscriptionId: string): Promise<boolean> {
    const updated = await this.prisma.subscription.updateMany({
      where: {
        id: subscriptionId,
        status: SubscriptionStatus.ACTIVE
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
        endedAt: new Date()
      }
    });

    if (updated.count === 0) {
      return false;
    }

    await this.channelAccessService.revokeAccessForSubscription(subscriptionId, 'EXPIRED');
    this.logger.log(`Subscription expired: ${subscriptionId}`);
    return true;
  }
}
