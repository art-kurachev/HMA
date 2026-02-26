# Интеграция Telegram Stars для покупки генераций

План реализации. Цель: за звёзды можно покупать дополнительные генерации.

---

## 1. Общий поток оплаты

1. **Frontend** — кнопка «Купить генерации» → запрос на backend за ссылкой на инвойс
2. **Backend** — вызывает Bot API `createInvoiceLink` (валюта `XTR`, `provider_token` пустой)
3. **Frontend** — `Telegram.WebApp.openInvoice(invoiceLink, callback)`
4. **Telegram** — показывает окно оплаты Stars
5. **Backend** — получает `pre_checkout_query` → отвечает `answerPreCheckoutQuery`, затем при успехе — `message.successful_payment`
6. **Backend** — начисляет генерации пользователю, сохраняет в БД
7. **Frontend** — callback `status === "paid"` → обновить квоту и UI

---

## 2. Backend

### Webhook для бота

Бот должен получать updates (webhook или long polling):

- `pre_checkout_query` → ответить `answerPreCheckoutQuery(ok=True)` в течение 10 секунд
- `message.successful_payment` → распарсить `payload`, вычислить `telegram_id`, начислить генерации

### Новые эндпоинты

- `POST /v1/stars/create-invoice` — принимает `telegram_id`, `amount` (в Stars), `product_label` → вызывает `createInvoiceLink`, возвращает URL
- Webhook для бота: `POST /webhook/telegram` — обрабатывает `pre_checkout_query` и `successful_payment`. Нужно вызвать `setWebhook` с URL `https://ваш-домен/webhook/telegram`.

### Модель User

Добавить поле: `paid_generations: int = 0`

### Quota

В `check_and_consume_quota` добавить источник после friday_bonus и weekly: списывать сначала из `paid_generations`.

---

## 3. Bot API

```python
# createInvoiceLink для Stars (цифровые товары)
# currency="XTR", provider_token=""
import httpx
import json

url = f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink"
payload = {
    "title": "1 генерация микса",
    "description": "Одна дополнительная генерация кальянного микса",
    "payload": json.dumps({"telegram_id": 123, "generations": 1}),
    "provider_token": "",
    "currency": "XTR",
    "prices": [{"label": "1 генерация", "amount": 10}]  # 10 Stars
}
r = await client.post(url, json=payload)
# result = "https://t.me/$..."
```

---

## 4. Frontend (Mini App)

```typescript
// В telegram.ts добавить openInvoice, если нет
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        openInvoice: (url: string, callback?: (status: string) => void) => void
        // ...
      }
    }
  }
}

// API
export async function createStarsInvoice(telegramId: number, generations: number) {
  const res = await request<{ invoice_link: string }>('/v1/stars/create-invoice', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId, generations }),
  })
  return res.invoice_link
}

// Использование
const link = await createStarsInvoice(telegramId, 1)
window.Telegram?.WebApp?.openInvoice(link, (status) => {
  if (status === 'paid') {
    getQuota(telegramId).then(/* обновить UI */)
  }
})
```

---

## 5. Цены и конфиг

- Сколько Stars за 1 генерацию — определить самим (обычно 5–15 Stars)
- Вынести в `.env` или админку: `STARS_PER_GENERATION=10`

---

## 6. Важные моменты

- Webhook: нужен HTTPS, публичный URL. При webhook — `setWebhook` на свой URL.
- `pre_checkout_query` обрабатывать быстро (в течение 10 секунд).
- Перед выдачей генераций проверять именно `successful_payment`, а не только `answerPreCheckoutQuery`.
- Сохранять `telegram_payment_charge_id` для возможных refund через `refundStarPayment`.

---

## 7. Файлы для изменений

| Файл | Изменения |
|------|-----------|
| `backend/app/db/models.py` | Поле `paid_generations` в User |
| `backend/app/core/quota.py` | Учёт и списание `paid_generations` |
| `backend/app/api/v1/routes_stars.py` (новый) | create-invoice, обработка successful_payment |
| `backend/app/main.py` | Webhook для telegram или отдельный роут |
| `frontend/src/api.ts` | `createStarsInvoice` |
| `frontend/src/telegram.ts` | Типы и вызов `openInvoice` |
| UI (WelcomeScreen / MixesStep) | Кнопка «Купить генерации» |
