# Правила разработки

## Для AI-агента

1. **Не удалять рабочий код** без явной причины и подтверждения.
2. **Не делать крупных рефакторов** без отдельного плана.
3. **Сохранять обратную совместимость** JSON-контрактов между frontend и backend.
4. **Не коммитить секреты** (.env, токены, ключи API). Проверять перед коммитом.
5. **Не пушить автоматически** — только по явной просьбе.
6. **Перезапускать backend** после изменения схем/провайдеров.
7. **Проверять линтер** после правок (`ReadLints`).
8. **Язык кода** — английский (переменные, комментарии). Язык UI и промптов — русский.
9. **Коммит-месседжи** — на русском, в формате `тип: описание` (feat, fix, refactor, docs, chore).

## Для команды

### Git

- Ветка по умолчанию: `main`
- Коммиты: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Не пушить в main с `--force`
- PR для крупных изменений

### Backend

- Python >= 3.10
- Все зависимости фиксированы в `requirements.txt` с версиями
- ORM-only: никаких raw SQL через f-string
- Pydantic-схемы для всех request/response
- Async-only: `async def` для всех endpoint'ов и провайдеров

### Frontend

- TypeScript strict mode
- CSS Modules (не inline styles)
- Компоненты — функциональные (hooks)
- API-типы дублируют backend-схемы
- Шрифт: Geologica

### Структура файлов

```
backend/app/api/v1/      # HTTP-роуты
backend/app/core/        # Бизнес-логика
backend/app/db/          # Модели и сессия
backend/app/providers/   # LLM-провайдеры
backend/app/schemas/     # Pydantic-схемы
frontend/src/components/ # React-компоненты + CSS Modules
```

### Безопасность

- CORS: явный список origins (не `"*"` в production)
- Telegram initData: верифицировать HMAC перед обработкой запроса
- Rate limiting: включить перед релизом
- Секреты: только через .env, никогда в код
