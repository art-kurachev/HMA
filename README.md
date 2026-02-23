# Hookah Mix Assistant — Telegram Mini App

Telegram Mini App для подбора кальянных миксов с ИИ-ассистентом.

## Стек

| Компонент | Технология |
|-----------|-----------|
| Frontend | React 18, TypeScript 5.6, Vite 6, CSS Modules |
| Backend | Python 3.10+, FastAPI 0.115, SQLAlchemy 2.0 (async) |
| БД | SQLite (dev) / PostgreSQL 16 (prod) |
| Infra | Docker Compose |

## Быстрый старт

```bash
# 1. Клонировать
git clone git@github.com:art-kurachev/HMA.git
cd HMA

# 2. Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# отредактировать .env при необходимости

# 3. Frontend
cd ../frontend
npm install

# 4. Запуск (backend + frontend одновременно)
cd ..
npm install        # корневой concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger: http://localhost:8000/docs

## Скрипты

```bash
npm run dev              # backend + frontend
npm run dev:backend      # только backend
npm run dev:frontend     # только frontend
npm run dev:admin        # admin-панель (localhost:5176)
npm run postgres         # docker compose up -d postgres
```

## Admin-панель

Отдельный фронт для администрирования: логин/пароль, статистика, настройки (лимит, провайдер), feedback.

1. Запустить backend и admin: `npm run dev:backend` (в одном терминале), `npm run dev:admin` (в другом)
2. Открыть http://localhost:5176
3. Логин/пароль — из `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, по умолчанию `admin`/`admin`)

### Frontend

```bash
cd frontend
npm run dev              # dev server
npm run build            # production build → dist/
npm run preview          # preview build
```

## БД

По умолчанию — SQLite (`hookah.db`). Для PostgreSQL:

```bash
docker compose up -d postgres
# в backend/.env:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hookah
```

pgAdmin: http://localhost:5050 (admin@local / admin)

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | /health | Healthcheck |
| POST | /v1/mixes/suggest | Генерация 3 миксов |
| POST | /v1/mixes/{id}/instruction | Инструкция для микса |
| POST | /v1/feedback/ | Отправка фидбека |

## Переменные окружения

См. `backend/.env.example` и документацию в `DEPLOY.md`.

## Документация

- [ARCHITECTURE.md](ARCHITECTURE.md) — архитектура и поток данных
- [SPEC.md](SPEC.md) — цели продукта и MVP
- [TASKS.md](TASKS.md) — backlog задач
- [DEPLOY.md](DEPLOY.md) — деплой и rollback
- [RUNBOOK.md](RUNBOOK.md) — диагностика инцидентов
- [RULES.md](RULES.md) — правила разработки
- [CHANGELOG.md](CHANGELOG.md) — история изменений
