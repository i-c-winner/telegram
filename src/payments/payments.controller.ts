import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { Payment } from '@prisma/client';
import { ClickService } from './click/click.service';
import { CreateClickPaymentDto } from './dto/create-click-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly clickService: ClickService
  ) {}

  @Post('click/create')
  createClickPayment(
    @Body() dto: CreateClickPaymentDto
  ): Promise<{ paymentUrl: string; providerPaymentId: string; raw: unknown }> {
    return this.clickService.createPayment(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<Payment> {
    const payment = await this.paymentsService.findPaymentById(id);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
