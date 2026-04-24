import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsCron {
  private readonly logger = new Logger(SubscriptionsCron.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expireSubscriptions(): Promise<void> {
    const now = new Date();
    const expired = await this.subscriptionsService.findExpiredActiveSubscriptions(now, 200);

    if (expired.length === 0) {
      return;
    }

    this.logger.log(`Found ${expired.length} expired subscriptions`);

    for (const subscription of expired) {
      await this.subscriptionsService.expireSubscription(subscription.id);
    }
  }
}
