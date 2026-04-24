import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('miniapp')
export class MiniAppController {
  @Get()
  render(@Query('lang') lang: string | undefined, @Res() res: Response): void {
    const safeLang = this.resolveLang(lang);
    const html = this.buildHtml(safeLang);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  private resolveLang(lang?: string): 'ru' | 'uz' | 'kz' {
    if (lang === 'uz' || lang === 'kz' || lang === 'ru') {
      return lang;
    }

    return 'ru';
  }

  private buildHtml(lang: 'ru' | 'uz' | 'kz'): string {
    const titleByLang = {
      ru: 'Приветствие',
      uz: 'Salomlashuv',
      kz: 'Сәлемдесу'
    };

    const baseGreetingByLang = {
      ru: 'Привет',
      uz: 'Salom',
      kz: 'Сәлем'
    };

    const subtitleByLang = {
      ru: 'Добро пожаловать в Mini App',
      uz: 'Mini App ga xush kelibsiz',
      kz: 'Mini App-қа қош келдіңіз'
    };

    const closeByLang = {
      ru: 'Закрыть',
      uz: 'Yopish',
      kz: 'Жабу'
    };

    const title = titleByLang[lang];
    const baseGreeting = baseGreetingByLang[lang];
    const subtitle = subtitleByLang[lang];
    const closeLabel = closeByLang[lang];

    return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
      :root {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: linear-gradient(140deg, #eaf6ff, #fff7ea);
        color: #1d2939;
      }
      .card {
        width: min(92vw, 460px);
        background: #ffffff;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 16px 40px rgba(16, 24, 40, 0.12);
        text-align: center;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 30px;
      }
      p {
        margin: 0;
        font-size: 16px;
        color: #475467;
      }
      button {
        margin-top: 18px;
        border: 0;
        border-radius: 12px;
        padding: 10px 16px;
        background: #1769ff;
        color: white;
        cursor: pointer;
        font-size: 15px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1 id="greeting">${baseGreeting}!</h1>
      <p>${subtitle}</p>
      <button id="close-btn">${closeLabel}</button>
    </main>

    <script>
      const tg = window.Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const greeting = document.getElementById('greeting');
      const user = tg?.initDataUnsafe?.user;
      const firstName = user?.first_name;
      if (firstName && greeting) {
        greeting.textContent = '${baseGreeting}, ' + firstName + '!';
      }

      const closeButton = document.getElementById('close-btn');
      closeButton?.addEventListener('click', () => {
        tg?.close();
      });
    </script>
  </body>
</html>`;
  }
}
