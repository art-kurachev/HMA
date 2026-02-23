import asyncio

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/notify", tags=["notify"])


class WarmupNotifyRequest(BaseModel):
    telegram_id: int
    warmup_seconds: int


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


async def _schedule_warmup_notify(telegram_id: int, warmup_seconds: int) -> None:
    """Background task: wait and send notification."""
    await asyncio.sleep(warmup_seconds)
    await send_telegram_message(
        telegram_id,
        "⏱ Таймер прогрева закончился! Можно начинать курить.",
    )


@router.post("/warmup")
async def schedule_warmup_notify(body: WarmupNotifyRequest):
    """Schedule a Telegram notification when warmup timer ends."""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=503, detail="BOT_TOKEN not configured")
    if body.warmup_seconds < 1 or body.warmup_seconds > 3600:
        raise HTTPException(status_code=400, detail="warmup_seconds must be 1-3600")
    asyncio.create_task(_schedule_warmup_notify(body.telegram_id, body.warmup_seconds))
    return {"ok": True}
