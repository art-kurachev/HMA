# TESTING

## Current State
Тестов нет. Проект не имеет test-файлов ни во frontend, ни в backend.

## Mock Provider
- `backend/app/providers/mock.py` — заменяет GigaChat для разработки
- Активируется при `LLM_PROVIDER=mock` в `.env` или отсутствии `GIGACHAT_AUTH_KEY`

## Manual Testing
- Development via `npm run dev` (backend :8000 + frontend Vite dev server)
- Telegram Mini App тестируется через Telegram (реальный или dev bot)
- `VITE_DEV_TELEGRAM_ID` — подставляет Telegram ID в dev-режиме

## What Should Be Tested (когда будет)
- `backend/app/core/quota.py` — сложная логика квот (welcome/weekly/paid/friday)
- `backend/app/core/prompt_builder.py` — правильность формирования промптов
- `backend/app/utils/telegram_auth.py` — валидация initData
- API endpoints — integration tests с test DB

## Test Infrastructure (отсутствует)
- Нет pytest конфигурации
- Нет тестовых fixtures
- Нет CI/CD pipeline с тестами
