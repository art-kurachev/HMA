# STACK

## Project Overview
Hookah Mix Assistant (HMA) — Telegram Mini App для подбора табачных миксов с AI-генерацией инструкций.

## Languages
- **TypeScript** — frontend (React), admin-frontend
- **Python 3.x** — backend (FastAPI)

## Runtimes
- **Node.js** (frontend build tooling — Vite)
- **Python** (backend — uvicorn)

## Frontend (`frontend/`)
- **React 18.3** — SPA, хук-ориентированная архитектура
- **Vite 6.0** — сборщик, dev-server
- **TypeScript ~5.6** — строгая типизация
- **CSS Modules** — изоляция стилей (каждый компонент имеет `.module.css`)
- Нет роутера (state-machine на `useState<Step>`)

## Backend (`backend/`)
- **FastAPI 0.115** — REST API, async
- **Uvicorn** — ASGI сервер
- **SQLAlchemy 2.0 asyncio** — ORM (async)
- **asyncpg** — PostgreSQL driver
- **aiosqlite** — SQLite driver (разработка)
- **Pydantic 2 + pydantic-settings** — схемы и конфиг из .env
- **httpx** — HTTP-клиент (GigaChat API)
- **APScheduler 3.10** — cron-задачи (friday refill)
- **PyJWT** — admin JWT auth
- **python-dotenv** — .env загрузка

## Admin Frontend (`admin-frontend/`)
- Отдельное React-приложение для управления настройками

## Database
- **PostgreSQL** (production) + **SQLite** (development, `hookah.db`)
- ORM: SQLAlchemy с asyncio, JSONB полями (PostgreSQL) / JSON (SQLite fallback)

## Configuration
- Backend: `backend/app/config.py` (pydantic-settings, читает `.env`)
- Frontend: Vite env vars `VITE_API_BASE`, `VITE_DEV_TELEGRAM_ID`
- Docker: `docker-compose.yml` (PostgreSQL сервис)

## Build & Dev
- Root `package.json` — `concurrently` для одновременного запуска frontend + backend
- `npm run dev` → backend (uvicorn :8000) + frontend (vite)
- `npm run postgres` → docker compose up postgres
