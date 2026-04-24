export interface GrantAccessInput {
  userTelegramId: bigint;
  channelTelegramChatId: bigint;
  subscriptionId: string;
  validUntil: Date;
}

export interface RevokeAccessInput {
  userTelegramId: bigint;
  channelTelegramChatId: bigint;
  reason: string;
}

export interface ITelegramGateway {
  grantChannelAccess(input: GrantAccessInput): Promise<void>;
  revokeChannelAccess(input: RevokeAccessInput): Promise<void>;
}

export const TELEGRAM_GATEWAY = Symbol('TELEGRAM_GATEWAY');
