import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsCron } from './subscriptions.cron';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [ScheduleModule.forRoot(), ChannelAccessModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsCron],
  exports: [SubscriptionsService]
})
export class SubscriptionsModule {}
