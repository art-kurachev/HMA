# Architecture Research — Shopping List

## Компоненты и границы

```
WelcomeScreen
  └── Кнопка "Список покупок"
        ↓
ShoppingListScreen (новый)
  ├── [пустой] → генерация
  ├── [есть список] → просмотр + чекбоксы
  └── Кнопка "Обновить" → подтверждение → регенерация

Backend:
  POST /v1/shopping-list/generate → quota check → LLM → сохранить → вернуть
  GET  /v1/shopping-list/         → вернуть текущий список
  PATCH /v1/shopping-list/check   → обновить чекбоксы
```

## Data Model

```python
class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id: int (PK)
    user_id: int (FK → users.id)
    mixes: JSONB  # список 10 миксов [{id, title, tobaccos, flavor}]
    checked_tobaccos: JSONB  # ["Darkside Hola", "MUSTHAVE Pinkman"]
    created_at: datetime
    updated_at: datetime

    UniqueConstraint("user_id")  # один список на пользователя
```

## Data Flow

1. **Первый визит:** GET → 404/null → показать "Сгенерировать список"
2. **Генерация:** POST generate → quota check → LLM prompt (10 миксов) → upsert ShoppingList → вернуть
3. **В магазине:** GET → показать список. PATCH check → обновить checked_tobaccos в БД
4. **Перегенерация:** POST generate (снова) → quota check → LLM → overwrite ShoppingList

## Frontend State

```typescript
type ShoppingListState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'loaded', mixes: Mix[], checkedTobaccos: string[] }
  | { status: 'error', message: string }
```

## Порядок сборки

1. DB model + migration → session init
2. Pydantic schemas
3. Backend routes (generate, get, check)
4. Prompt builder (10 миксов)
5. Quota integration
6. Frontend API functions
7. ShoppingListScreen component
8. Интеграция в WelcomeScreen (кнопка)

## Интеграция с квотой

- `generate` вызывает `check_and_consume_quota()` — идентично `/v1/mixes/suggest`
- Если quota_exceeded → 429 → фронт показывает стандартное сообщение о лимите
