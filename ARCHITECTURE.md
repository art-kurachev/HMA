# Архитектура

## Общая схема

```
┌─────────────────────────┐
│   Telegram Mini App     │
│   (React + Vite)        │
│   localhost:5173         │
└──────────┬──────────────┘
           │ /api/* (Vite proxy → :8000)
           ▼
┌─────────────────────────┐
│   FastAPI Backend        │
│   localhost:8000         │
│                          │
│  ┌─────────────────────┐│
│  │  Provider Router     ││  mock / gigachat / yandexgpt / ab
│  │  (A/B testing)       ││
│  └──────────┬──────────┘│
│             ▼            │
│  ┌─────────────────────┐│
│  │  LLM Provider        ││  generate_mixes / generate_instruction
│  │  (mock → LLM API)    ││
│  └─────────────────────┘│
│             │            │
│  ┌──────────▼──────────┐│
│  │  SQLAlchemy (async)  ││
│  │  SQLite / PostgreSQL ││
│  └─────────────────────┘│
└─────────────────────────┘
```

## Модули Backend

```
backend/app/
├── main.py                 # FastAPI app, CORS, lifespan (init_db)
├── config.py               # Settings из .env (pydantic-settings)
├── api/v1/
│   ├── routes_mixes.py     # POST /suggest, POST /{id}/instruction
│   └── routes_feedback.py  # POST /feedback
├── core/
│   ├── provider_router.py  # Выбор LLM-провайдера, A/B split
│   ├── prompt_builder.py   # Промпты для LLM (mixes, instruction)
│   ├── rate_limit.py       # Дневной лимит запросов per user
│   └── cache.py            # Заготовка для кэширования
├── db/
│   ├── models.py           # ORM: User, Session, GeneratedMix, Feedback, DailyUsage
│   ├── session.py          # async engine, session maker, init_db
│   └── migrations.sql      # DDL для ручной миграции
├── providers/
│   ├── base.py             # BaseProvider ABC
│   ├── mock.py             # Захардкоженные ответы
│   ├── gigachat.py         # Stub → GigaChat API
│   └── yandexgpt.py        # Stub → YandexGPT API
├── schemas/
│   ├── mix.py              # MixParams, MixItem, SuggestRequest/Response
│   ├── instruction.py      # TobaccoItem, InstructionResponse
│   └── feedback.py         # FeedbackRequest
└── utils/
    ├── telegram_auth.py    # Stub: верификация initData (TODO)
    └── hash.py             # SHA-256 утилита
```

## Модули Frontend

```
frontend/src/
├── main.tsx                # ReactDOM.createRoot
├── App.tsx                 # Роутинг по шагам (state machine)
├── api.ts                  # HTTP-клиент, типы запросов/ответов
├── telegram.ts             # Telegram WebApp SDK (initData, expand)
├── types.ts                # FormState и общие типы
└── components/
    ├── WelcomeScreen       # Приветствие, кнопка старта
    ├── DirectionScreen     # Выбор направления
    ├── SetupScreen         # Параметры: чаша, жар, табаки
    ├── MixesStep           # 3 карточки миксов
    ├── InstructionStep     # Инструкция + таймер + проблемы
    ├── FeedbackStep        # Оценка микса
    ├── ScreenLayout        # Layout: прогресс, кнопка назад
    ├── BottomNav           # Нижняя навигация
    └── Icons               # SVG-иконки
```

## Поток данных

```
1. WelcomeScreen → DirectionScreen → SetupScreen
                                        │
                    POST /v1/mixes/suggest (params)
                                        ▼
2. MixesStep (3 карточки: title, tobaccos, flavor)
       │
       │ выбор микса → POST /v1/mixes/{id}/instruction
       ▼
3. InstructionStep (табаки %, забивка, прогрев, курение)
       │   └── Таймер прогрева (warmup_seconds)
       │   └── Sheet «Проблемы»
       ▼
4. FeedbackStep → POST /v1/feedback (rating, reason)
       │
       ▼
   WelcomeScreen (цикл)
```

## БД: таблицы и связи

```
users ─────┬──► daily_usage    (лимит запросов/день)
           ├──► sessions       (параметры запроса)
           └──► feedback       (оценка микса)

sessions ──► generated_mixes   (сгенерированные миксы, JSON)
generated_mixes ──► feedback
```

## Provider Router (A/B тестирование)

```
LLM_PROVIDER=mock       → MockProvider (захардкоженные ответы)
LLM_PROVIDER=gigachat   → GigaChatProvider (stub → Sber API)
LLM_PROVIDER=yandexgpt  → YandexGPTProvider (stub → Yandex API)
LLM_PROVIDER=ab         → 50/50 split: gigachat | yandexgpt (per user)
```

Группа A/B сохраняется в `users.provider_group` при первом запросе.
