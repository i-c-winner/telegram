import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { Context, Telegraf } from 'telegraf';
import { callbackQuery, message } from 'telegraf/filters';
import { UsersService } from '../users/users.service';
import { BotLang, resolveLang, t } from './bot.i18n';
import {
  LANGUAGE_CALLBACK_PREFIX,
  getLanguageKeyboard,
  getMainKeyboard,
  getMiniAppInlineKeyboard
} from './bot.keyboards';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot?: Telegraf<Context>;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService
  ) {}

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is missing. Bot polling will not start.');
      return;
    }

    try {
      this.bot = new Telegraf<Context>(token);
      this.registerHandlers(this.bot);
      await this.bot.launch();
      this.logger.log('Telegram bot polling started');
    } catch (error) {
      this.logger.error(`Telegram bot launch failed: ${String(error)}`);
      this.bot = undefined;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.bot) {
      this.bot.stop('SIGTERM');
    }
  }

  private registerHandlers(bot: Telegraf<Context>): void {
    bot.start(async (ctx) => {
      const lang = await this.getUserLang(ctx.from?.id);
      const miniAppUrl = this.buildMiniAppUrl(lang);

      await ctx.reply(t(lang, 'start_menu'), getMainKeyboard(lang));

      const miniAppInlineKeyboard = getMiniAppInlineKeyboard(lang, miniAppUrl);
      if (miniAppInlineKeyboard) {
        await ctx.reply(t(lang, 'main_open_miniapp'), miniAppInlineKeyboard);
      }
    });

    bot.on(message('text'), async (ctx) => {
      const fromId = ctx.from?.id;
      const lang = await this.getUserLang(fromId);
      const text = ctx.message.text.trim();

      if (text === t(lang, 'main_change_language')) {
        await ctx.reply(t(lang, 'choose_language'), getLanguageKeyboard());
        return;
      }

      await ctx.reply(t(lang, 'unknown_command'), getMainKeyboard(lang));
    });

    bot.on(callbackQuery('data'), async (ctx) => {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.answerCbQuery();
        return;
      }

      const data = ctx.callbackQuery.data;
      if (!data.startsWith(LANGUAGE_CALLBACK_PREFIX)) {
        await ctx.answerCbQuery();
        return;
      }

      const lang = this.extractLang(data);
      if (!lang || !ctx.from?.id) {
        await ctx.answerCbQuery();
        return;
      }

      await this.usersService.updateLanguageByTelegramId(ctx.from.id, lang);
      await ctx.answerCbQuery(t(lang, 'language_changed'));
      await ctx.reply(t(lang, 'language_changed'), getMainKeyboard(lang));

      const miniAppInlineKeyboard = getMiniAppInlineKeyboard(lang, this.buildMiniAppUrl(lang));
      if (miniAppInlineKeyboard) {
        await ctx.reply(t(lang, 'main_open_miniapp'), miniAppInlineKeyboard);
      }
    });
  }

  private async getUserLang(telegramId?: number): Promise<BotLang> {
    if (!telegramId) {
      return 'ru';
    }

    const user: User | null = await this.usersService.findByTelegramId(telegramId);
    return resolveLang(user?.language);
  }

  private buildMiniAppUrl(lang: BotLang): string | null {
    const base = this.configService.get<string>('MINI_APP_URL') ?? 'http://localhost:3000/miniapp';

    try {
      const url = new URL(base);
      if (url.protocol !== 'https:') {
        this.logger.warn(`MINI_APP_URL must be HTTPS for Telegram buttons: ${base}`);
        return null;
      }
      url.searchParams.set('lang', lang);
      return url.toString();
    } catch {
      this.logger.warn(`MINI_APP_URL is invalid (${base}).`);
      return null;
    }
  }

  private extractLang(data: string): BotLang | null {
    const value = data.replace(LANGUAGE_CALLBACK_PREFIX, '');
    if (value === 'ru' || value === 'uz' || value === 'kz') {
      return value;
    }
    return null;
  }
}
