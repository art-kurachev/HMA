# ARCHITECTURE

## Pattern
**Monorepo** с тремя независимыми сервисами:
- `frontend/` — React SPA (Telegram Mini App)
- `backend/` — FastAPI REST API
- `admin-frontend/` — React SPA для администраторов

## System Layers

```
[Telegram App] → [React Frontend] → [FastAPI Backend] → [GigaChat LLM]
                                          ↕
                                    [PostgreSQL/SQLite]
                                          ↑
                           [Telegram Bot Webhook (Stars/Notify)]
```

## Frontend Architecture
- **State machine** на `useState<Step>` в `App.tsx`
- Steps: `welcome → direction → setup → mixes → instruction → feedback → done`
- Нет роутера — все экраны рендерятся условно в одном компоненте
- **Draft persistence:** `localStorage` через `draftStorage.ts` (сохраняет прогресс между сессиями)
- **Shelf:** список сохранённых миксов (`shelfStorage.ts`)
- **API layer:** `api.ts` — все HTTP вызовы с timeout и abort control
- **Telegram layer:** `telegram.ts` — WebApp SDK wrapper

## Backend Architecture
### Layered structure:
```
app/api/v1/        → HTTP routes (FastAPI routers)
app/core/          → Business logic (quota, prompt_builder, provider_router, etc.)
app/providers/     → LLM provider abstractions (base, gigachat, mock)
app/db/            → Database (models, session)
app/schemas/       → Pydantic schemas
app/utils/         → Utilities (hash, telegram_auth)
```

### LLM Flow:
1. Route handler (`routes_mixes.py`) вызывает `quota.check_and_consume_quota()`
2. Quota решает: allowed? какой provider/model?
3. `provider_router.py` создаёт нужный провайдер
4. `prompt_builder.py` генерирует промпт
5. Провайдер вызывает GigaChat API
6. Результат сохраняется в `Session` + `GeneratedMix`

### Quota System:
- 3 welcome генерации (GigaChat-max)
- После — 1/неделю
- Friday bonus: +1 по пятницам если остаток ≤ 3
- Paid: за Telegram Stars
- Creator: безлимитный (из `CREATOR_TELEGRAM_IDS`)
- Отключается через `DISABLE_DAILY_LIMIT` (default: true)

## API Endpoints
- `POST /v1/mixes/suggest` — полный подбор миксов по параметрам сетапа
- `POST /v1/mixes/quick-suggest` — быстрый подбор по направлению (movie/relax/surprise)
- `POST /v1/mixes/{mix_id}/instruction` — инструкция по конкретному миксу
- `GET /v1/mixes/quota` — остаток квоты пользователя
- `POST /v1/notify/warmup` / `cancel` — таймер прогрева через Telegram
- `POST /v1/stars/create-invoice`, `GET /v1/stars/packages` — оплата Stars
- `POST /v1/feedback/` — оценка микса
- `/admin/*` — управление настройками (LLM provider, model, quota)
- `POST /webhook/telegram` — Telegram Bot webhook

## Authentication
- Пользователи: Telegram `initData` в header `X-Telegram-Init-Data`
- Admin: JWT (username/password)

## Data Flow — Mix Generation
1. Пользователь выбирает параметры (чаша, угли, крепость, табаки)
2. Frontend POST `/v1/mixes/suggest`
3. Backend: проверка квоты → выбор провайдера → построение промпта → GigaChat API
4. Ответ: 3 микса (JSON)
5. Пользователь выбирает микс
6. Frontend POST `/v1/mixes/{id}/instruction`
7. Backend: GigaChat генерирует инструкцию (packing, warmup, smoking, if_not_opened)
8. Frontend показывает инструкцию + таймер прогрева
