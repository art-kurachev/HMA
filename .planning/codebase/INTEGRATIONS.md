# INTEGRATIONS

## LLM Providers

### GigaChat (Сбер)
- **Файл:** `backend/app/providers/gigachat.py`
- **Роутер:** `backend/app/core/provider_router.py`
- **Конфиг:** `GIGACHAT_AUTH_KEY`, `GIGACHAT_SCOPE`, `GIGACHAT_MODEL` в `.env`
- Поддерживаемые модели: `GigaChat-2-Pro` (default), настраивается через admin
- Fallback: если `GIGACHAT_AUTH_KEY` не задан → MockProvider

### Mock Provider
- **Файл:** `backend/app/providers/mock.py`
- Используется в разработке и при отсутствии API-ключей

## Telegram
- **Bot API** — уведомления, webhooks, оплата Stars
- **Конфиг:** `BOT_TOKEN`, `APP_URL` в `.env`
- **Webhook endpoint:** `POST /webhook/telegram` (`backend/app/api/webhook_telegram.py`)
- **Функции:**
  - `pre_checkout_query` — подтверждение оплаты Stars
  - `successful_payment` — начисление платных генераций
  - Warmup уведомления (`/v1/notify/warmup`)
  - `backend/app/core/telegram.py` — отправка уведомлений

### Telegram Mini App (WebApp)
- **Frontend:** `frontend/src/telegram.ts`
- Использует `window.Telegram.WebApp` API
- `initData` → `X-Telegram-Init-Data` header для auth
- Bot API 8.0+ fullscreen mode (`requestFullscreen`)
- `openInvoice` — Stars payment flow

## Database
- **PostgreSQL** (production) — `asyncpg` driver
- **SQLite** (dev) — `aiosqlite` driver
- **Connection:** `DATABASE_URL` в `.env`
- **Session:** `backend/app/db/session.py`

## Admin Panel
- JWT-аутентификация (`PyJWT`)
- Конфиг: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` в `.env`
- **Роуты:** `backend/app/api/v1/routes_admin.py`
- Настройки хранятся в таблице `app_settings` (key-value)

## Monetization — Telegram Stars
- **Endpoint:** `backend/app/api/v1/routes_stars.py`
- `GET /v1/stars/packages` — пакеты генераций
- `POST /v1/stars/create-invoice` — создать invoice ссылку
- Платёж → webhook → `Purchase` запись в БД → `user.paid_generations++`

## Scheduled Tasks
- **APScheduler** — cron в `backend/app/main.py`
- Пятничный бонус: каждую пятницу в 19:00 MSK (`backend/app/core/friday_refill.py`)
