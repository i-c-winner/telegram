import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() dto: CreatePlanDto): Promise<Plan> {
    return this.plansService.create(dto);
  }

  @Get()
  findAll(): Promise<Plan[]> {
    return this.plansService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto): Promise<Plan> {
    return this.plansService.update(id, dto);
  }
}
