# STRUCTURE

## Root Layout
```
HMA/
├── frontend/              # Telegram Mini App (React + Vite)
├── backend/               # API server (FastAPI + Python)
├── admin-frontend/        # Admin panel (React)
├── docs/                  # Documentation
├── references/            # Reference materials
├── scripts/               # Dev scripts (figma-export.mjs)
├── docker-compose.yml     # PostgreSQL container
├── package.json           # Root: concurrently для dev
├── SPEC.md                # Product specification
├── TASKS.md               # Task tracker
├── RULES.md               # Development rules/conventions
└── ARCHITECTURE.md, CHANGELOG.md, DEPLOY.md, etc.
```

## Frontend (`frontend/src/`)
```
src/
├── App.tsx                # Root component, state machine (Step)
├── main.tsx               # Entry point
├── api.ts                 # API client (все HTTP функции)
├── telegram.ts            # Telegram WebApp SDK wrapper
├── types.ts               # Shared types (FormState, options)
├── draftStorage.ts        # localStorage persistence
├── shelfStorage.ts        # Saved mixes shelf
├── vite-env.d.ts
├── *.css / *.module.css   # Global + module styles
└── components/
    ├── WelcomeScreen.tsx       # Экран приветствия
    ├── DirectionScreen.tsx     # Выбор направления (movie/relax/surprise)
    ├── SetupScreen.tsx         # Форма параметров сетапа
    ├── FormStep.tsx            # Форма (подкомпонент)
    ├── MixesStep.tsx           # Список из 3 миксов
    ├── InstructionStep.tsx     # Инструкция + таймер прогрева
    ├── FeedbackStep.tsx        # Оценка микса (👍/👎)
    ├── ShelfSheet.tsx          # Полка сохранённых миксов
    ├── BottomNav.tsx           # Навигационная панель
    ├── ScreenLayout.tsx        # Layout wrapper
    ├── Loader.tsx              # Загрузчик
    ├── Icons.tsx               # SVG иконки
    ├── ProgressRow.tsx         # Прогресс
    └── *.module.css            # CSS Modules для каждого компонента
```

## Backend (`backend/app/`)
```
app/
├── main.py                # FastAPI app, lifespan, middleware, schedulers
├── config.py              # Settings (pydantic-settings, .env)
├── api/
│   ├── v1/
│   │   ├── __init__.py        # api_router (aggregates all routes)
│   │   ├── routes_mixes.py    # /v1/mixes/* (suggest, quick-suggest, instruction, quota)
│   │   ├── routes_feedback.py # /v1/feedback/
│   │   ├── routes_notify.py   # /v1/notify/warmup
│   │   ├── routes_stars.py    # /v1/stars/*
│   │   └── routes_admin.py    # /admin/* (settings management)
│   └── webhook_telegram.py    # /webhook/telegram
├── core/
│   ├── prompt_builder.py      # LLM промпты (build_mixes_prompt, build_instruction_prompt)
│   ├── provider_router.py     # Выбор LLM провайдера, generate_* функции
│   ├── quota.py               # Система квот (welcome/weekly/paid/creator)
│   ├── admin_auth.py          # JWT аутентификация для admin
│   ├── app_settings.py        # Чтение/запись app_settings из БД
│   ├── telegram.py            # Отправка уведомлений через Bot API
│   ├── llm_queue.py           # Очередь LLM запросов
│   ├── rate_limit.py          # Rate limiting
│   ├── cache.py               # Кэш
│   └── friday_refill.py       # Пятничный бонус (cron)
├── providers/
│   ├── base.py                # BaseProvider, MixProviderInput, InstructionProviderInput
│   ├── gigachat.py            # GigaChat реализация
│   └── mock.py                # Mock провайдер для разработки
├── db/
│   ├── models.py              # SQLAlchemy models: User, Session, GeneratedMix, Feedback, Purchase, AppSetting, DailyUsage
│   └── session.py             # async_session_maker, init_db
├── schemas/
│   ├── mix.py                 # MixItem, SuggestRequest, InstructionRequest схемы
│   ├── instruction.py         # InstructionResponse
│   └── feedback.py            # FeedbackRequest
└── utils/
    ├── hash.py                # Хэширование
    └── telegram_auth.py       # Валидация Telegram initData
```

## Naming Conventions
- Файлы: `snake_case` (Python), `PascalCase.tsx` (React components), `camelCase.ts` (утилиты)
- CSS Modules: `ComponentName.module.css` рядом с компонентом
- Python: `routes_{resource}.py` для роутов, `{provider_name}.py` для провайдеров
- DB models: PascalCase (`User`, `GeneratedMix`)
- API routes prefix: `/api/v1/` (настраивается через `VITE_API_BASE`)
