import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { ChannelAccessService } from './channel-access.service';

@Module({
  imports: [TelegramModule],
  providers: [ChannelAccessService],
  exports: [ChannelAccessService]
})
export class ChannelAccessModule {}
