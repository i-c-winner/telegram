import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Channel } from '@prisma/client';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelsService } from './channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() dto: CreateChannelDto): Promise<Channel> {
    return this.channelsService.create(dto);
  }

  @Get()
  findAll(): Promise<Channel[]> {
    return this.channelsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChannelDto): Promise<Channel> {
    return this.channelsService.update(id, dto);
  }
}
