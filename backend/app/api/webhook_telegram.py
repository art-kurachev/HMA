"""Webhook для Telegram Bot: pre_checkout_query и successful_payment (Stars)."""

import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Request, Response

from app.config import settings
from app.db.session import async_session_maker
from app.db.models import User
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhook"])


async def _answer_pre_checkout(pre_checkout_query_id: str, ok: bool = True, error_message: Optional[str] = None):
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/answerPreCheckoutQuery"
    data = {"pre_checkout_query_id": pre_checkout_query_id, "ok": ok}
    if not ok and error_message:
        data["error_message"] = error_message
    async with httpx.AsyncClient() as client:
        await client.post(url, json=data, timeout=5)


@router.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """Принимает updates от Telegram. Обрабатывает pre_checkout_query и successful_payment."""
    if not settings.BOT_TOKEN:
        return Response(status_code=503)

    try:
        body = await request.json()
    except Exception:
        return Response(status_code=400)

    # pre_checkout_query — нужно ответить в течение 10 секунд
    pre_checkout = body.get("pre_checkout_query")
    if pre_checkout:
        qid = pre_checkout.get("id")
        if qid:
            await _answer_pre_checkout(qid, ok=True)
        return Response()

    # successful_payment — начислить генерации
    msg = body.get("message")
    if msg:
        sp = msg.get("successful_payment")
        if sp:
            payload_str = sp.get("invoice_payload")
            if payload_str:
                try:
                    payload = json.loads(payload_str)
                    telegram_id = payload.get("telegram_id")
                    generations = int(payload.get("generations", 0))
                    if telegram_id and generations > 0:
                        async with async_session_maker() as db:
                            row = await db.execute(select(User).where(User.telegram_id == telegram_id))
                            user = row.scalar_one_or_none()
                            if user:
                                user.paid_generations = (user.paid_generations or 0) + generations
                                await db.commit()
                                logger.info("Stars paid: telegram_id=%s +%d generations", telegram_id, generations)
                            else:
                                logger.warning("Stars paid: user not found telegram_id=%s", telegram_id)
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning("Stars payment payload parse error: %s", e)

    return Response()
