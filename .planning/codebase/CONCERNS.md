# CONCERNS

## Security

### Auth
- `ADMIN_JWT_SECRET` по умолчанию `"change-me-in-production"` — **критично для продакшена**
  - Файл: `backend/app/config.py`
- `ADMIN_PASSWORD` по умолчанию `"admin"` — **критично**
- `CORS allow_origins=["*"]` в `backend/app/main.py` — широкая политика

### Telegram Auth
- `X-Telegram-Init-Data` валидируется в `backend/app/utils/telegram_auth.py`
- Некоторые роуты могут не проверять подпись — стоит аудит

## Technical Debt

### No Tests
- Полное отсутствие тестов (unit, integration, e2e)
- Сложная quota-логика без тестового покрытия (`core/quota.py`)

### Single LLM Provider
- Только GigaChat — нет fallback на другой LLM
- Если GigaChat недоступен → 503 для всех пользователей
- Файл `core/provider_router.py`: упоминаются удалённые `yandexgpt` и `ab` провайдеры

### Database Dual-Mode
- JSONB vs JSON fallback усложняет код (`JSONB().with_variant(JSON(), "sqlite")`)
- SQLite в dev, PostgreSQL в prod — потенциальные расхождения поведения

## Performance

### LLM Queue
- `backend/app/core/llm_queue.py` — есть очередь, но её поведение нужно проверить под нагрузкой
- GigaChat timeout у пользователя: 90 секунд для suggest, 45 для quick-suggest — долго

### No Caching
- `backend/app/core/cache.py` — файл существует, но степень использования неизвестна
- Промпты одинаковые для похожих запросов — потенциал кэширования ответов LLM

## Code Concerns

### Friday Refill Migration
- `backend/run_migrate_friday_bonus.py` — скрипт миграции лежит в корне backend, не в alembic
- Нет Alembic миграций — `init_db()` создаёт таблицы через `create_all`

### Hardcoded Fallback Tobaccos
- В `provider_router.py`: `tobaccos = ... or ["Black Nana", "Blue Horse", "Darkside Core"]`
- Fallback-табаки хардкожены в логике

### Frontend Draft Storage
- При изменении схемы `DraftState` старые `localStorage` записи могут сломать приложение
- Нет версионирования schema

### Admin Frontend
- `admin-frontend/` — отдельное приложение без детальной документации
- Неясно насколько связан с основным frontend

## Missing Features (по TASKS.md)
- Автокомплит табаков
- Похожие миксы / рекомендации
- Реферальная программа
- Онбординг

## Deployment
- `DEPLOY.md` есть, но нет CI/CD автоматизации
- Railway предполагается как хостинг (судя по `APP_URL` и упоминаниям)
