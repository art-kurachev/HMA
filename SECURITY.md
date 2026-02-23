# Security Checklist

## Перед релизом

- [ ] Реализовать верификацию Telegram `initData` (HMAC-SHA256 с bot token)
- [ ] Ограничить CORS — задать конкретные origins вместо `"*"`
- [ ] Включить rate limiting: `DISABLE_DAILY_LIMIT=false`
- [ ] Убрать fallback `telegram_id = 123456789` из App.tsx
- [ ] Не возвращать traceback в production (FastAPI `debug=False`)
- [ ] HTTPS на всех endpoints
- [ ] Секреты только через .env, не в коде и не в git
- [ ] Переименовать `VITE_FIGMA_TOKEN` → `FIGMA_TOKEN` (без VITE_ префикса)

## Регулярно

- [ ] `pip audit` — проверка уязвимостей Python-зависимостей
- [ ] `npm audit` — проверка уязвимостей Node-зависимостей
- [ ] Обновлять зависимости (Dependabot / ручной `pip install --upgrade`)
- [ ] Проверять логи на подозрительную активность

## Известные ограничения (MVP)

| Риск | Описание | Статус |
|------|----------|--------|
| Нет аутентификации | telegram_id передаётся клиентом без проверки | TODO |
| CORS `"*"` | API доступен с любого origin | TODO |
| Rate limit выключен | `DISABLE_DAILY_LIMIT=true` | dev only |
| Нет IP throttling | Нет защиты от DDoS/burst | TODO |
