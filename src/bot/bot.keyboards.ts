import { Markup } from 'telegraf';
import { BotLang, t } from './bot.i18n';

export const LANGUAGE_CALLBACK_PREFIX = 'language:';

export function getMainKeyboard(lang: BotLang) {
  return Markup.keyboard([[t(lang, 'main_change_language')]])
    .resize()
    .persistent();
}

export function getLanguageKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🇷🇺 Русский', `${LANGUAGE_CALLBACK_PREFIX}ru`)],
    [Markup.button.callback('🇺🇿 O\'zbekcha', `${LANGUAGE_CALLBACK_PREFIX}uz`)],
    [Markup.button.callback('🇰🇿 Қазақша', `${LANGUAGE_CALLBACK_PREFIX}kz`)]
  ]);
}

export function getMiniAppInlineKeyboard(lang: BotLang, miniAppUrl: string | null) {
  if (!miniAppUrl) {
    return undefined;
  }

  return Markup.inlineKeyboard([
    [Markup.button.url(t(lang, 'main_open_miniapp'), miniAppUrl)]
  ]);
}
