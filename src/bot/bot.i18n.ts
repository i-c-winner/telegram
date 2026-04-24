export type BotLang = 'ru' | 'uz' | 'kz';

type Keys =
  | 'start_menu'
  | 'choose_language'
  | 'language_changed'
  | 'main_change_language'
  | 'main_open_miniapp'
  | 'miniapp_unavailable'
  | 'unknown_command';

const DICT: Record<BotLang, Record<Keys, string>> = {
  ru: {
    start_menu: 'Выберите действие:',
    choose_language: 'Выберите язык:',
    language_changed: 'Язык изменен',
    main_change_language: '🌐 Изменить язык',
    main_open_miniapp: '📱 Открыть Mini App',
    miniapp_unavailable: 'Mini App временно недоступен. Укажите HTTPS URL в MINI_APP_URL.',
    unknown_command: 'Нажмите одну из кнопок внизу.'
  },
  uz: {
    start_menu: 'Amalni tanlang:',
    choose_language: 'Tilni tanlang:',
    language_changed: 'Til o\'zgartirildi',
    main_change_language: '🌐 Tilni o\'zgartirish',
    main_open_miniapp: '📱 Mini App ochish',
    miniapp_unavailable: 'Mini App vaqtincha mavjud emas. MINI_APP_URL uchun HTTPS manzilni kiriting.',
    unknown_command: 'Pastdagi tugmalardan birini bosing.'
  },
  kz: {
    start_menu: 'Әрекетті таңдаңыз:',
    choose_language: 'Тілді таңдаңыз:',
    language_changed: 'Тіл өзгертілді',
    main_change_language: '🌐 Тілді өзгерту',
    main_open_miniapp: '📱 Mini App ашу',
    miniapp_unavailable: 'Mini App уақытша қолжетімсіз. MINI_APP_URL үшін HTTPS сілтемесін орнатыңыз.',
    unknown_command: 'Төмендегі батырмалардың бірін басыңыз.'
  }
};

export function resolveLang(language?: string | null): BotLang {
  if (language === 'uz' || language === 'kz' || language === 'ru') {
    return language;
  }
  return 'ru';
}

export function t(lang: BotLang, key: Keys): string {
  return DICT[lang][key] ?? DICT.ru[key];
}
