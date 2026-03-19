# CONVENTIONS

## Python (Backend)

### Code Style
- **Ruff** для линтинга (`backend/ruff.toml`)
- `from __future__ import annotations` — в большинстве файлов
- Type hints везде (Python typing + Pydantic)
- `Optional[T]` для nullable полей

### Patterns
- Async/await повсеместно (FastAPI + SQLAlchemy asyncio)
- Dependency injection через FastAPI `Depends()`
- Business logic в `core/`, не в роутах
- Провайдеры через абстрактный `BaseProvider` (`providers/base.py`)
- Settings через `pydantic-settings` singleton `settings = Settings()`
- Admin settings через `get_app_settings(db)` — читается из БД, кэшируется

### Error Handling
- LLM ошибки → `RuntimeError` → глобальный обработчик → HTTP 503
- `httpx` ошибки → маппинг на понятные сообщения в `main.py`
- Логирование через `logging.getLogger("uvicorn.error")`

### Database
- Все операции через `AsyncSession`
- `await db.flush()` после изменений (без commit внутри функций — commit на уровне роута)
- JSONB для PostgreSQL, JSON для SQLite (через `with_variant`)

## TypeScript (Frontend)

### Code Style
- Strict TypeScript
- `interface` для объектов, `type` для unions/aliases
- Именованные экспорты везде (не default import для компонентов)
- Arrow functions + `useCallback` для стабильных хендлеров

### Patterns
- CSS Modules — каждый компонент имеет `.module.css`
- Props через `interface` c явными типами
- `useState` + `useCallback` + `useEffect` — стандартные хуки
- Нет сторонних state-менеджеров (только useState)
- Ошибки хранятся в `error: string | null` в App.tsx

### API Calls
- Все API запросы в `api.ts` — fetch wrapper с timeout/abort
- `X-Telegram-Init-Data` заголовок добавляется автоматически
- Fallback ID (`123456789`) блокирует реальные запросы в prod

### Storage
- `localStorage` через `draftStorage.ts` и `shelfStorage.ts`
- Драфт сохраняется при каждом изменении шага

## LLM Prompts
- Все промпты в `backend/app/core/prompt_builder.py`
- `SPELLING_RULES` и `FORBIDDEN_RULES` — константы, встраиваются в каждый промпт
- Строгий JSON-only output (без markdown)
- Русскоязычные промпты и ответы

## Git
- Коммиты на русском языке
- Префиксы: `fix:`, `feat:`, `refactor:`, `docs:`, `style:`
- Worktree-based workflow для Claude Code
