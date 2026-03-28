"""Telegram Bot API helpers."""

from typing import Optional

import httpx

from app.config import settings


async def send_telegram_message(
    chat_id: int, text: str, *, parse_mode: Optional[str] = None
) -> bool:
    """Send message via Telegram Bot API. parse_mode: HTML | Markdown | MarkdownV2."""
    if not settings.BOT_TOKEN:
        return False
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/sendMessage"
    payload: dict = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, json=payload, timeout=10.0)
            return r.is_success
        except Exception:
            return False
