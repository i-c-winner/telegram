import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, BotModule]
})
export class AppModule {}
