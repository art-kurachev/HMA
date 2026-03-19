# Stack Research — Shopping List Feature

## Существующий стек (менять не нужно)

Фича добавляется в уже работающий проект, стек зафиксирован.

### Backend additions
- **FastAPI route** — новый эндпоинт `/v1/shopping-list/` (GET, POST, PATCH)
- **SQLAlchemy model** — таблица `shopping_lists` / `shopping_list_items`
- **Pydantic schemas** — ShoppingList, ShoppingListItem
- Всё уже есть в проекте, просто добавляем новые файлы по паттернам

### Frontend additions
- **React component** — `ShoppingListScreen.tsx` (новый экран)
- **API функции** в `api.ts` — getShoppingList, generateShoppingList, updateItemChecked
- **localStorage fallback** — не нужен (сервер)
- CSS Modules — по паттерну проекта

### Генерация 10 миксов
- Расширение существующего `build_quick_mixes_prompt` в `prompt_builder.py`
- Или отдельная функция `build_shopping_list_prompt` — предпочтительнее для читаемости
- GigaChat токен лимит: ~8192 токенов. 10 миксов × ~50 токенов каждый ≈ 500 токенов → безопасно

### Хранение на сервере
- Простая JSON-колонка (`JSONB`) в таблице — как `Session.params`
- Один список на пользователя (upsert) — проще чем много списков
- Состояние чекбоксов — массив отмеченных табаков (`checked_tobaccos: list[str]`)

## Рекомендации

| Компонент | Решение | Rationale |
|-----------|---------|-----------|
| API | `/v1/shopping-list/` REST | Соответствует паттерну `/v1/mixes/` |
| DB | Новая таблица `ShoppingList` | Изолировано, не засоряет другие таблицы |
| Чекбоксы | `PATCH /v1/shopping-list/check` | Частичное обновление без перезаписи всего списка |
| Промпт | Отдельный `build_shopping_list_prompt()` | Читаемость, независимость от quick-suggest |
