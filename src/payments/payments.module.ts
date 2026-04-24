import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChannelAccessModule } from '../channel-access/channel-access.module';
import { ClickService } from './click/click.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [ConfigModule, ChannelAccessModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, ClickService],
  exports: [PaymentsService, ClickService]
})
export class PaymentsModule {}
