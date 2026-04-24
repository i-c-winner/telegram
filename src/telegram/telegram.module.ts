import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TELEGRAM_GATEWAY } from './telegram.types';
import { TelegramService } from './telegram.service';

@Module({
  imports: [ConfigModule],
  providers: [
    TelegramService,
    {
      provide: TELEGRAM_GATEWAY,
      useExisting: TelegramService
    }
  ],
  exports: [TELEGRAM_GATEWAY, TelegramService]
})
export class TelegramModule {}
