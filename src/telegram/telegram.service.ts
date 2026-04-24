import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { GrantAccessInput, ITelegramGateway, RevokeAccessInput } from './telegram.types';

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

interface ChatInviteLinkResult {
  invite_link: string;
}

@Injectable()
export class TelegramService implements ITelegramGateway {
  private readonly logger = new Logger(TelegramService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const apiBase = this.configService.get<string>('TELEGRAM_API_BASE') ?? 'https://api.telegram.org';

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    this.http = axios.create({
      baseURL: `${apiBase}/bot${token}`,
      timeout: 10_000
    });
  }

  async grantChannelAccess(input: GrantAccessInput): Promise<void> {
    const expireDate = Math.floor(input.validUntil.getTime() / 1000);

    const inviteLink = await this.callTelegram<ChatInviteLinkResult>('createChatInviteLink', {
      chat_id: input.channelTelegramChatId.toString(),
      member_limit: 1,
      expire_date: expireDate,
      name: `sub_${input.subscriptionId}`
    });

    await this.callTelegram('sendMessage', {
      chat_id: input.userTelegramId.toString(),
      text: `Оплата подтверждена. Ссылка для входа в канал: ${inviteLink.invite_link}`
    });
  }

  async revokeChannelAccess(input: RevokeAccessInput): Promise<void> {
    const userId = input.userTelegramId.toString();
    const chatId = input.channelTelegramChatId.toString();

    try {
      await this.callTelegram('banChatMember', {
        chat_id: chatId,
        user_id: userId,
        until_date: Math.floor(Date.now() / 1000) + 60
      });

      await this.callTelegram('unbanChatMember', {
        chat_id: chatId,
        user_id: userId,
        only_if_banned: true
      });
    } catch (error) {
      this.logger.error(`Failed to revoke access: ${String(error)}`);
      throw error;
    }
  }

  private async callTelegram<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
    const response = await this.http.post<TelegramResponse<T>>(`/${method}`, payload);

    if (!response.data.ok) {
      throw new Error(response.data.description ?? `Telegram API error: ${method}`);
    }

    return response.data.result;
  }
}
