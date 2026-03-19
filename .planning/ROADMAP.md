# Roadmap — Shopping List Feature

## Overview

**2 phases** | **15 requirements** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|-----------------|
| 1 | Backend | API + DB + генерация 10 миксов | SHOP-01..07 | 4 |
| 2 | Frontend | UI экран + интеграция в приложение | SHOP-08..15 | 4 |

---

## Phase 1: Backend

**Goal:** Рабочий API для списка покупок — генерация, хранение, чекбоксы.

**Requirements:**
- SHOP-01: Пользователь может сгенерировать список покупок (10 миксов) без параметров
- SHOP-02: Генерация расходует квоту пользователя
- SHOP-03: Список сохраняется на сервере по Telegram ID
- SHOP-04: Один активный список на пользователя (upsert)
- SHOP-05: Пользователь может получить текущий список
- SHOP-06: Пользователь может обновить отмеченные табаки
- SHOP-07: 10 миксов генерируются разнообразными (бренды, профили, крепости)

**Plans:**
1. DB model `ShoppingList` + регистрация в `init_db`
2. Промпт `build_shopping_list_prompt()` — 10 разнообразных миксов
3. Routes: `POST /v1/shopping-list/generate`, `GET /v1/shopping-list/`, `PATCH /v1/shopping-list/check`

**Success Criteria:**
1. `POST /v1/shopping-list/generate` возвращает 10 миксов и сохраняет в БД
2. `GET /v1/shopping-list/` возвращает список с состоянием чекбоксов
3. `PATCH /v1/shopping-list/check` обновляет `checked_tobaccos` без перезаписи миксов
4. Повторный `POST generate` overwrite-ит старый список (upsert), квота списывается

---

## Phase 2: Frontend

**Goal:** Полноценный экран списка покупок в приложении.

**Requirements:**
- SHOP-08: Кнопка "Список покупок" на WelcomeScreen
- SHOP-09: Онбординг-состояние при пустом списке
- SHOP-10: Уникальные табаки, отсортированные по частоте использования
- SHOP-11: Чекбоксы рядом с каждым табаком
- SHOP-12: Купленные табаки визуально отличаются
- SHOP-13: По тапу на микс — раскрывается состав с пропорциями
- SHOP-14: Диалог подтверждения перегенерации
- SHOP-15: Состояние чекбоксов сохраняется на сервере

**Plans:**
1. API функции в `api.ts` + типы (getShoppingList, generateShoppingList, updateChecked)
2. `ShoppingListScreen.tsx` — основной экран (список табаков + аккордеон миксов)
3. Интеграция: кнопка на WelcomeScreen, роутинг в App.tsx, draft persistence

**Success Criteria:**
1. Кнопка на главном экране открывает ShoppingListScreen
2. Пустой список показывает онбординг с CTA, нажатие генерирует и отображает список
3. Чекбоксы работают — отметил табак, вышел, зашёл — отметка сохранилась
4. Тап на микс раскрывает состав. Кнопка "Обновить" показывает диалог перед генерацией
