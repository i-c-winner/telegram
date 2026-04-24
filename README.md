# NestJS Telegram Subscriptions Backend

Production-oriented backend for Telegram paid channel subscriptions.

## 1) Architecture

- **API Layer (Controllers)**: webhooks + admin CRUD (plans/channels/users) + read endpoints.
- **Domain Services**: payment processing, subscription lifecycle, channel access management.
- **Integration Layer**: Telegram API abstraction (`ITelegramGateway`) + payment provider adapter (`ClickService`).
- **Persistence Layer**: Prisma ORM + PostgreSQL with indexed schema.
- **Background Jobs**: cron task that expires subscriptions and revokes access.

Core rule: **channel access exists only while subscription is ACTIVE**.

## 2) Folder Structure

```text
src/
  app.module.ts
  main.ts
  common/
    exceptions/
  prisma/
    prisma.module.ts
    prisma.service.ts
  users/
    dto/
    users.controller.ts
    users.service.ts
    users.module.ts
  channels/
    dto/
    channels.controller.ts
    channels.service.ts
    channels.module.ts
  plans/
    dto/
    plans.controller.ts
    plans.service.ts
    plans.module.ts
  payments/
    click/click.service.ts
    dto/
      create-click-payment.dto.ts
      click-webhook.dto.ts
      payment-webhook.dto.ts
    payments.controller.ts
    payments.service.ts
    payments.module.ts
  subscriptions/
    subscriptions.controller.ts
    subscriptions.service.ts
    subscriptions.cron.ts
    subscriptions.module.ts
  channel-access/
    channel-access.service.ts
    channel-access.module.ts
  telegram/
    telegram.types.ts
    telegram.service.ts
    telegram.module.ts
  webhooks/
    webhooks.controller.ts
    webhooks.module.ts
  health/
    health.controller.ts
    health.module.ts
prisma/
  schema.prisma
```

## 3) Prisma Schema

See full schema: `prisma/schema.prisma`.

Entities:
- `users`
- `plans`
- `payments`
- `subscriptions`
- `channels`
- `channel_access`

Indexes are defined directly in schema (`@@index`, `@@unique`) for lookup and cron patterns.

## 4) Modules

- `UsersModule`
- `ChannelsModule`
- `PlansModule`
- `PaymentsModule`
- `SubscriptionsModule`
- `ChannelAccessModule`
- `TelegramModule`
- `WebhooksModule`
- `HealthModule`
- `PrismaModule`

## 5) Services Code (What matters)

- `PaymentsService.handleWebhook()`:
  - validates webhook secret
  - idempotent by `idempotencyKey`
  - transaction with `Serializable` isolation
  - extends active subscription or reactivates expired one
  - marks payment as processed once
  - grants channel access via abstraction

- `ClickService`:
  - `createPayment()` sends provider create request (adapter format, extend as per official docs)
  - `verifyWebhookSignature()` validates HMAC SHA-256 signature from `x-click-signature`
  - `mapWebhookToInternal()` maps Click payload to internal `PaymentWebhookDto`

- `SubscriptionsService` + `SubscriptionsCron`:
  - finds expired active subscriptions
  - flips status to `EXPIRED`
  - revokes Telegram access

- `ChannelAccessService`:
  - creates `channel_access` on grant
  - stores revoke timestamp/reason on revoke

## 6) Cron Code

`src/subscriptions/subscriptions.cron.ts`
- runs every minute
- scans ACTIVE subscriptions with `paidUntil <= now`
- expires and revokes access

## 7) Subscription Flow

1. Payment provider sends webhook (`POST /webhooks/payments` or `POST /webhooks/payments/click`).
2. Backend validates signature/secret.
3. Idempotency check by `idempotencyKey`.
4. If `status != SUCCEEDED` -> payment persisted, no access.
5. If `SUCCEEDED`:
   - if active subscription exists -> extend `paid_until`
   - if expired/no subscription -> create/reactivate ACTIVE subscription
6. Mark payment `processedAt` (single-time processing).
7. Grant Telegram channel access and persist `channel_access` grant fact.
8. Cron later revokes access when expired and stores revoke fact.

## 8) Telegram Integration Abstraction

`src/telegram/telegram.types.ts`
- `ITelegramGateway` interface decouples domain from Telegram API.

`src/telegram/telegram.service.ts`
- concrete implementation via Telegram Bot API (`axios`):
  - `grantChannelAccess()` -> creates one-time invite link, sends it to user
  - `revokeChannelAccess()` -> ban/unban to revoke channel membership

Swap this service to integrate another provider without rewriting domain services.

## 9) Error Handling

- Global exception filter: `AllExceptionsFilter`.
- Validation via global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`.
- Domain-level explicit errors:
  - invalid webhook secret/signature -> `401/403`
  - missing config -> `400`
  - missing/inactive plan/channel -> `404`

## 10) Launch Steps

1. Install dependencies:
```bash
npm install
```

2. Create env:
```bash
cp .env.example .env
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Sync schema:
```bash
npx prisma db push
```

5. Start dev server:
```bash
npm run start:dev
```

6. Health check:
```bash
curl http://localhost:3000/health
```

## Click endpoints (scaffold)

### Create Click payment

```bash
curl -X POST http://localhost:3000/payments/click/create \
  -H "Content-Type: application/json" \
  -d '{
    "telegramUserId": 123456789,
    "username": "demo_user",
    "planCode": "channel_1m",
    "amount": "50000",
    "currency": "UZS",
    "returnUrl": "https://your-domain.com/payment-result"
  }'
```

### Click webhook

```bash
curl -X POST http://localhost:3000/webhooks/payments/click \
  -H "Content-Type: application/json" \
  -H "x-click-signature: <hmac_sha256_hex>" \
  -d '{
    "providerPaymentId": "tx_1001",
    "eventId": "evt_1001",
    "status": "success",
    "telegramUserId": 123456789,
    "username": "demo_user",
    "planCode": "channel_1m",
    "amount": "50000",
    "currency": "UZS",
    "paidAt": "2026-04-19T11:40:00.000Z"
  }'
```

## Environment Variables

See `.env.example`.
