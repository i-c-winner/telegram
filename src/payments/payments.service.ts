import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentStatus,
  Prisma,
  Subscription,
  SubscriptionStatus
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';
import { ChannelAccessService } from '../channel-access/channel-access.service';

interface WebhookResult {
  paymentId: string;
  subscriptionId: string | null;
  status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'IGNORED';
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly channelAccessService: ChannelAccessService
  ) {}

  async handleWebhook(dto: PaymentWebhookDto, secretHeader?: string): Promise<WebhookResult> {
    this.validateWebhookSecret(secretHeader);
    return this.processWebhook(dto);
  }

  async handleTrustedWebhook(dto: PaymentWebhookDto): Promise<WebhookResult> {
    return this.processWebhook(dto);
  }

  private async processWebhook(dto: PaymentWebhookDto): Promise<WebhookResult> {
    const outcome = await this.prisma.$transaction(
      async (tx) => {
        const plan = await tx.plan.findUnique({ where: { code: dto.planCode }, include: { channel: true } });
        if (!plan || !plan.isActive || !plan.channel.isActive) {
          throw new NotFoundException('Plan or channel is inactive or not found');
        }

        const user = await tx.user.upsert({
          where: { telegramId: BigInt(dto.telegramUserId) },
          update: { username: dto.username },
          create: {
            telegramId: BigInt(dto.telegramUserId),
            username: dto.username,
            language: 'ru'
          }
        });

        const existingByIdempotency = await tx.payment.findUnique({
          where: { idempotencyKey: dto.idempotencyKey }
        });

        if (existingByIdempotency?.processedAt) {
          return {
            payment: existingByIdempotency,
            subscription: null,
            status: 'ALREADY_PROCESSED' as const
          };
        }

        const paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
        const rawPayload = (dto.payload ?? {}) as Prisma.InputJsonValue;

        const payment = existingByIdempotency
          ? await tx.payment.update({
              where: { id: existingByIdempotency.id },
              data: {
                providerPaymentId: dto.providerPaymentId,
                amount: new Prisma.Decimal(dto.amount),
                currency: dto.currency,
                status: dto.status,
                paidAt,
                rawPayload
              }
            })
          : await tx.payment.create({
              data: {
                provider: dto.provider,
                providerPaymentId: dto.providerPaymentId,
                idempotencyKey: dto.idempotencyKey,
                amount: new Prisma.Decimal(dto.amount),
                currency: dto.currency,
                status: dto.status,
                paidAt,
                rawPayload,
                userId: user.id,
                planId: plan.id
              }
            });

        if (dto.status !== PaymentStatus.SUCCEEDED) {
          return { payment, subscription: null, status: 'IGNORED' as const };
        }

        const now = new Date();
        const activeSubscription = await tx.subscription.findFirst({
          where: {
            userId: user.id,
            channelId: plan.channelId,
            status: SubscriptionStatus.ACTIVE
          },
          orderBy: { paidUntil: 'desc' }
        });

        let subscription: Subscription;
        if (activeSubscription && activeSubscription.paidUntil > now) {
          const extendedUntil = this.addDays(activeSubscription.paidUntil, plan.durationDays);
          subscription = await tx.subscription.update({
            where: { id: activeSubscription.id },
            data: {
              paidUntil: extendedUntil,
              planId: plan.id,
              lastPaymentId: payment.id
            }
          });
        } else if (activeSubscription) {
          const newStartedAt = now;
          const newPaidUntil = this.addDays(newStartedAt, plan.durationDays);
          subscription = await tx.subscription.update({
            where: { id: activeSubscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              startedAt: newStartedAt,
              paidUntil: newPaidUntil,
              endedAt: null,
              planId: plan.id,
              lastPaymentId: payment.id
            }
          });
        } else {
          const startedAt = now;
          const paidUntil = this.addDays(startedAt, plan.durationDays);
          subscription = await tx.subscription.create({
            data: {
              userId: user.id,
              planId: plan.id,
              channelId: plan.channelId,
              status: SubscriptionStatus.ACTIVE,
              startedAt,
              paidUntil,
              lastPaymentId: payment.id
            }
          });
        }

        const processedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            processedAt: new Date(),
            subscriptionId: subscription.id,
            status: PaymentStatus.SUCCEEDED
          }
        });

        return {
          payment: processedPayment,
          subscription,
          status: 'PROCESSED' as const
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (outcome.status === 'PROCESSED' && outcome.subscription) {
      await this.channelAccessService.grantAccessForSubscription(outcome.subscription.id);
      this.logger.log(`Payment processed: ${outcome.payment.id}`);
      return {
        paymentId: outcome.payment.id,
        subscriptionId: outcome.subscription.id,
        status: 'PROCESSED'
      };
    }

    return {
      paymentId: outcome.payment.id,
      subscriptionId: null,
      status: outcome.status
    };
  }

  private validateWebhookSecret(secretHeader?: string): void {
    const expected = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!expected) {
      throw new BadRequestException('PAYMENT_WEBHOOK_SECRET is not configured');
    }

    if (!secretHeader || secretHeader !== expected) {
      throw new ForbiddenException('Invalid webhook secret');
    }
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }
}
