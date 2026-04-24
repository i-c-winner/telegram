"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const telegraf_1 = require("telegraf");
dotenv_1.default.config();
const token = process.env.TELEGRAM_BOT_TOKEN;
const externalUrl = process.env.EXTERNAL_BROWSER_URL ?? 'https://telegram-enter.railway.internal';
if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
}
const bot = new telegraf_1.Telegraf(token);
const externalKeyboard = telegraf_1.Markup.inlineKeyboard([
    [telegraf_1.Markup.button.url('Открыть сайт', externalUrl)]
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
    .catch((error) => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
