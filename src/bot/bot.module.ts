import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramBotService } from './bot.service';

@Module({
  imports: [ConfigModule],
  providers: [TelegramBotService]
})
export class BotModule {}
