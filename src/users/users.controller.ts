import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { User } from '@prisma/client';
import { UpsertUserDto } from './dto/upsert-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('upsert')
  upsert(@Body() dto: UpsertUserDto): Promise<User> {
    return this.usersService.upsert(dto);
  }

  @Get('telegram/:telegramId')
  findByTelegramId(
    @Param('telegramId', ParseIntPipe) telegramId: number
  ): Promise<User | null> {
    return this.usersService.findByTelegramId(telegramId);
  }
}
