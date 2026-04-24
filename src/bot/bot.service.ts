import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Context, Markup, Telegraf } from 'telegraf';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly externalUrl: string;
  private bot?: Telegraf<Context>;

  constructor(private readonly configService: ConfigService) {
    this.externalUrl =
      this.configService.get<string>('EXTERNAL_BROWSER_URL') ?? 'https://telegram-enter.railway.internal';
  }

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is missing. Bot polling will not start.');
      return;
    }

    this.bot = new Telegraf<Context>(token);
    this.registerHandlers(this.bot);
    await this.bot.launch();
    this.logger.log('Minimal Telegram bot polling started');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  private registerHandlers(bot: Telegraf<Context>): void {
    bot.start(async (ctx) => {
      await ctx.reply('Открыть сайт:', this.getExternalKeyboard());
    });

    bot.command('start', async (ctx) => {
      await ctx.reply('Открыть сайт:', this.getExternalKeyboard());
    });
  }

  private getExternalKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.url('Открыть во внешнем браузере', this.externalUrl)]
    ]);
  }
}
