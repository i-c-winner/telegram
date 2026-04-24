import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChannelAccessStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ITelegramGateway, TELEGRAM_GATEWAY } from '../telegram/telegram.types';

@Injectable()
export class ChannelAccessService {
  private readonly logger = new Logger(ChannelAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEGRAM_GATEWAY) private readonly telegramGateway: ITelegramGateway
  ) {}

  async grantAccessForSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true, channel: true }
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return;
    }

    const existing = await this.prisma.channelAccess.findFirst({
      where: {
        subscriptionId,
        status: ChannelAccessStatus.ACTIVE
      }
    });

    if (existing) {
      return;
    }

    await this.telegramGateway.grantChannelAccess({
      userTelegramId: subscription.user.telegramId,
      channelTelegramChatId: subscription.channel.telegramChatId,
      subscriptionId: subscription.id,
      validUntil: subscription.paidUntil
    });

    await this.prisma.channelAccess.create({
      data: {
        userId: subscription.userId,
        channelId: subscription.channelId,
        subscriptionId: subscription.id,
        status: ChannelAccessStatus.ACTIVE,
        grantedAt: new Date()
      }
    });
  }

  async revokeAccessForSubscription(
    subscriptionId: string,
    reason: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const access = await client.channelAccess.findFirst({
      where: {
        subscriptionId,
        status: ChannelAccessStatus.ACTIVE
      },
      include: { user: true, channel: true }
    });

    if (!access) {
      return;
    }

    await this.telegramGateway.revokeChannelAccess({
      userTelegramId: access.user.telegramId,
      channelTelegramChatId: access.channel.telegramChatId,
      reason
    });

    await client.channelAccess.update({
      where: { id: access.id },
      data: {
        status: ChannelAccessStatus.REVOKED,
        revokedAt: new Date(),
        revokeReason: reason
      }
    });

    this.logger.log(`Access revoked for subscription ${subscriptionId}`);
  }
}
