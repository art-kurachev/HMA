import asyncio
from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.core.telegram import send_telegram_message
from app.utils.telegram_auth import resolve_telegram_id

router = APIRouter(prefix="/notify", tags=["notify"])

# Храним задачи уведомлений по telegram_id для возможности отмены при паузе
_warmup_tasks: dict[int, asyncio.Task] = {}


class WarmupNotifyRequest(BaseModel):
    telegram_id: int
    warmup_seconds: int


class WarmupCancelRequest(BaseModel):
    telegram_id: int


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
async def schedule_warmup_notify(
    body: WarmupNotifyRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
):
    """Schedule a Telegram notification when warmup timer ends."""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=503, detail="BOT_TOKEN not configured")
    if body.warmup_seconds < 1 or body.warmup_seconds > 3600:
        raise HTTPException(status_code=400, detail="warmup_seconds must be 1-3600")
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    _cancel_warmup_task(uid)
    task = asyncio.create_task(_schedule_warmup_notify(uid, body.warmup_seconds))
    _warmup_tasks[uid] = task
    return {"ok": True}


@router.post("/warmup/cancel")
async def cancel_warmup_notify(
    body: WarmupCancelRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
):
    """Cancel scheduled warmup notification (when user pauses timer)."""
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    cancelled = _cancel_warmup_task(uid)
    return {"ok": True, "cancelled": cancelled}
