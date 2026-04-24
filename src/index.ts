import dotenv from 'dotenv';
import { Markup, Telegraf } from 'telegraf';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const externalUrl = process.env.EXTERNAL_BROWSER_URL ?? 'https://telegramenter-production.up.railway.app';

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not configured');
}

const bot = new Telegraf(token);

const externalKeyboard = Markup.inlineKeyboard([
  [Markup.button.url('Открыть сайт', externalUrl)]
]);

bot.start(async (ctx) => {
  await ctx.reply('Перейдите на сайт:', externalKeyboard);
});

bot.command('start', async (ctx) => {
  await ctx.reply('Перейдите на сайт:', externalKeyboard);
});

bot.on('message', async (ctx) => {
  await ctx.reply('Нажмите кнопку ниже:', externalKeyboard);
});

bot
  .launch()
  .then(() => {
    console.log('Simple Telegram bot started');
  })
  .catch((error: unknown) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
  });

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
