# Backlog задач

## Приоритет: Критический (до релиза)

- [ ] Реализовать верификацию Telegram initData (HMAC-SHA256)
- [ ] Ограничить CORS — вынести origins в env, убрать `"*"`
- [ ] Включить дневной лимит (`DISABLE_DAILY_LIMIT=false`)
- [ ] Подключить хотя бы один LLM-провайдер (GigaChat или YandexGPT)
- [ ] Деплой backend на хостинг (VPS / Railway / Render)
- [ ] Деплой frontend (Vercel / Netlify / nginx)
- [ ] Настроить HTTPS
- [ ] Зарегистрировать Mini App в BotFather

## Приоритет: Высокий

- [ ] Добавить Dockerfile для backend
- [ ] Настроить CI/CD (GitHub Actions: lint + build)
- [ ] Добавить IP-based rate limiting (slowapi)
- [ ] Глобальный exception handler на backend
- [ ] Структурированное логирование (structlog / logging)
- [ ] Добавить линтеры: Ruff (backend), ESLint + Prettier (frontend)
- [ ] Healthcheck с проверкой БД (`SELECT 1`)
- [ ] Миграции через Alembic вместо `create_all`
- [ ] Переименовать `VITE_FIGMA_TOKEN` → `FIGMA_TOKEN`

## Приоритет: Средний

- [ ] Написать тесты: backend API (pytest + httpx)
- [ ] Написать тесты: frontend компоненты (vitest)
- [ ] Push-уведомление при завершении таймера (Bot API)
- [ ] Кэширование ответов LLM (Redis или in-memory)
- [ ] Аналитика: дашборд по фидбеку и использованию
- [ ] Зафиксировать версии Python/Node (.python-version, .nvmrc, engines)
- [ ] Race condition в rate limiter — `SELECT ... FOR UPDATE`
- [ ] Заменить `datetime.utcnow` на `datetime.now(UTC)`

## Приоритет: Низкий (nice-to-have)

- [ ] Распознавание табаков по фото (Tesseract.js + база табаков)
- [ ] Telegram Bot с inline mode
- [ ] Мультиязычность
- [ ] Тёмная/светлая тема по Telegram theme
- [ ] Анимации переходов между экранами
- [ ] PWA manifest
- [ ] Dependabot / Renovate
