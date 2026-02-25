import asyncio
from typing import Dict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/notify", tags=["notify"])

# Храним задачи уведомлений по telegram_id для возможности отмены при паузе
_warmup_tasks: Dict[int, asyncio.Task] = {}


class WarmupNotifyRequest(BaseModel):
    telegram_id: int
    warmup_seconds: int


class WarmupCancelRequest(BaseModel):
    telegram_id: int


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
    try:
        await asyncio.sleep(warmup_seconds)
        await send_telegram_message(
            telegram_id,
            "⏱ Таймер прогрева закончился! Можно начинать курить.",
        )
    except asyncio.CancelledError:
        # Таймер на паузе — отменяем уведомление
        raise
    finally:
        _warmup_tasks.pop(telegram_id, None)


def _cancel_warmup_task(telegram_id: int) -> bool:
    """Cancel scheduled warmup notification. Returns True if a task was cancelled."""
    task = _warmup_tasks.get(telegram_id)
    if task and not task.done():
        task.cancel()
        _warmup_tasks.pop(telegram_id, None)
        return True
    return False


@router.post("/warmup")
async def schedule_warmup_notify(body: WarmupNotifyRequest):
    """Schedule a Telegram notification when warmup timer ends."""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=503, detail="BOT_TOKEN not configured")
    if body.warmup_seconds < 1 or body.warmup_seconds > 3600:
        raise HTTPException(status_code=400, detail="warmup_seconds must be 1-3600")
    _cancel_warmup_task(body.telegram_id)
    task = asyncio.create_task(_schedule_warmup_notify(body.telegram_id, body.warmup_seconds))
    _warmup_tasks[body.telegram_id] = task
    return {"ok": True}


@router.post("/warmup/cancel")
async def cancel_warmup_notify(body: WarmupCancelRequest):
    """Cancel scheduled warmup notification (when user pauses timer)."""
    cancelled = _cancel_warmup_task(body.telegram_id)
    return {"ok": True, "cancelled": cancelled}
