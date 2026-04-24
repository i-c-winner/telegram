import { Module } from '@nestjs/common';
import { MiniAppController } from './miniapp.controller';

@Module({
  controllers: [MiniAppController]
})
export class MiniAppModule {}
