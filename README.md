# Hookah Assistant (Telegram Mini App)

## Быстрый старт

### Вариант 1: Всё одной командой

```bash
cd hookah-assistant
npm install
# Если нужен Postgres:
docker compose up -d postgres
cp backend/.env.example backend/.env
# Запуск backend + frontend:
npm run dev
```

### Вариант 2: По шагам

```bash
# 1. Postgres (опционально; по умолчанию SQLite)
cd hookah-assistant && docker compose up -d postgres
cp backend/.env.example backend/.env

# 2. Backend
cd backend && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend (в другом терминале)
cd frontend && npm install && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

Vite проксирует `/api` на backend (port 8000).

### Production

- Backend: `VITE_API_BASE=https://your-api.com` при сборке frontend
- Собери: `npm run build` → `dist/` для хостинга

## Docker Compose

- **Postgres**: user=postgres, pass=postgres, db=hookah, port=5432
- **pgAdmin**: http://localhost:5050, login=admin@local, pass=admin

## ENV

Backend: скопируй `backend/.env.example` в `backend/.env`
