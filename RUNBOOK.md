# Runbook — диагностика и быстрые команды

## Проверка состояния

```bash
# Backend запущен?
curl http://localhost:8000/health
# Ожидание: {"status":"ok"}

# Frontend запущен?
curl -s http://localhost:5173 | head -1
# Ожидание: <!DOCTYPE html>

# PostgreSQL доступен?
docker exec hookah-postgres pg_isready -U postgres
# Ожидание: accepting connections

# Процессы на портах
lsof -i :8000   # backend
lsof -i :5173   # frontend
lsof -i :5432   # postgres
```

## Типичные проблемы

### Backend не запускается

```bash
# Проверить логи
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
# Смотреть traceback

# Частые причины:
# 1. Нет .env → cp .env.example .env
# 2. Нет venv → python -m venv .venv && pip install -r requirements.txt
# 3. Порт занят → lsof -i :8000 -t | xargs kill
```

### Frontend не запускается

```bash
cd frontend && npm run dev
# Частые причины:
# 1. Нет node_modules → npm install
# 2. Порт занят → будет выбран следующий (5174, 5175...)
```

### CORS ошибка в браузере

```
Access to fetch has been blocked by CORS policy
```

- Dev: Vite proxy должен работать (запросы через `/api`)
- Prod: проверить `CORS_ORIGINS` в backend/.env

### 429 Too Many Requests

```bash
# Проверить лимит
python -c "from app.config import settings; print(settings.DAILY_REQUEST_LIMIT, settings.DISABLE_DAILY_LIMIT)"
# Сбросить: удалить запись в daily_usage или DISABLE_DAILY_LIMIT=true
```

### БД недоступна

```bash
# SQLite — файл hookah.db в backend/
ls -la backend/hookah.db

# PostgreSQL
docker compose up -d postgres
docker logs hookah-postgres
```

### Миксы не генерируются (пустой ответ)

```bash
# Тест API напрямую
curl -X POST http://localhost:8000/v1/mixes/suggest \
  -H 'Content-Type: application/json' \
  -d '{"telegram_id":123,"params":{"bowl":"phunnel","heat_control":"kaloud","has_cap":true,"coal_size":25,"coal_count_start":3,"strength":"medium","profiles":[],"available_tobaccos_text":"Black Nana, Blue Horse"}}'
```

## Мониторинг (production)

```bash
# Логи backend (systemd)
sudo journalctl -u hookah-api -f

# Логи nginx
sudo tail -f /var/log/nginx/error.log

# Диск
df -h

# Память
free -m

# PostgreSQL размер БД
docker exec hookah-postgres psql -U postgres -d hookah -c "SELECT pg_size_pretty(pg_database_size('hookah'));"
```

## Экстренный перезапуск

```bash
# Backend
sudo systemctl restart hookah-api

# PostgreSQL
docker compose restart postgres

# Всё
sudo systemctl restart hookah-api && docker compose restart postgres && sudo systemctl reload nginx
```

## Данные в БД

```bash
# SQLite
cd backend && sqlite3 hookah.db
.tables
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM generated_mixes;
SELECT COUNT(*) FROM feedback;

# PostgreSQL
docker exec -it hookah-postgres psql -U postgres -d hookah
\dt
SELECT COUNT(*) FROM users;
```
