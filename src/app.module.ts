import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { ChannelsModule } from './channels/channels.module';
import { PaymentsModule } from './payments/payments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TelegramModule } from './telegram/telegram.module';
import { ChannelAccessModule } from './channel-access/channel-access.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { BotModule } from './bot/bot.module';
import { MiniAppModule } from './miniapp/miniapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    PlansModule,
    ChannelsModule,
    TelegramModule,
    ChannelAccessModule,
    SubscriptionsModule,
    PaymentsModule,
    WebhooksModule,
    HealthModule,
    BotModule,
    MiniAppModule
  ]
})
export class AppModule {}
