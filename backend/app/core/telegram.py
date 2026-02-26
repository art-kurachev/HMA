"""Telegram Bot API helpers."""

import httpx

from app.config import settings


async def send_telegram_message(chat_id: int, text: str) -> bool:
    """Send message via Telegram Bot API."""
    if not settings.BOT_TOKEN:
        return False
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(
                url,
                json={"chat_id": chat_id, "text": text},
                timeout=10.0,
            )
            return r.is_success
        except Exception:
            return False
