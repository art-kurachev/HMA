"""Telegram Bot API helpers."""

from typing import Any, Optional

import httpx

from app.config import settings


async def get_telegram_chat(chat_id: int) -> Optional[dict[str, Any]]:
    """
    getChat: для личного чата chat_id = user id.
    Возвращает объект Chat (first_name, last_name, username для private) или None при ошибке.
    """
    if not settings.BOT_TOKEN:
        return None
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/getChat"
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, json={"chat_id": chat_id}, timeout=10.0)
            if not r.is_success:
                return None
            data = r.json()
            if not data.get("ok"):
                return None
            return data.get("result")
        except Exception:
            return None


async def send_telegram_message(chat_id: int, text: str, *, parse_mode: Optional[str] = None) -> bool:
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
