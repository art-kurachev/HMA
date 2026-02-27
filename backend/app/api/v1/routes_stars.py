"""Telegram Stars: покупка генераций за звёзды."""

import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.app_settings import get_app_settings
from app.core.provider_router import ensure_user_and_provider_group
from app.db.session import get_db
from app.utils.telegram_auth import resolve_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stars", tags=["stars"])


class CreateInvoiceRequest(BaseModel):
    telegram_id: int
    generations: int
    stars: int


@router.get("/packages")
async def get_stars_packages(db: AsyncSession = Depends(get_db)):
    """Публичный список пакетов: [{generations, stars}, ...]. Источник — админка."""
    cfg = await get_app_settings(db)
    raw = cfg.get("stars_packages", "[]")
    try:
        packages = json.loads(raw)
    except json.JSONDecodeError:
        packages = [{"generations": 1, "stars": 1}]
    if not isinstance(packages, list):
        packages = [{"generations": 1, "stars": 1}]
    return {"packages": packages}


@router.post("/create-invoice")
async def create_stars_invoice(
    body: CreateInvoiceRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Создать инвойс для оплаты Stars. Возвращает invoice_link для openInvoice."""
    if not settings.BOT_TOKEN:
        raise HTTPException(status_code=503, detail="BOT_TOKEN not configured")
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    await ensure_user_and_provider_group(db, uid)

    # Проверить, что пакет есть в настройках
    cfg = await get_app_settings(db)
    raw = cfg.get("stars_packages", "[]")
    try:
        packages = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail="stars_packages misconfigured") from e
    matched = next(
        (p for p in packages if p.get("generations") == body.generations and p.get("stars") == body.stars),
        None,
    )
    if not matched:
        raise HTTPException(status_code=400, detail="package_not_found")

    payload = json.dumps({"telegram_id": uid, "generations": body.generations, "stars": body.stars})
    title = f"{body.generations} рекомендаций"
    description = f"Дополнительно {body.generations} генераций микса"
    url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/createInvoiceLink"
    data = {
        "title": title,
        "description": description,
        "payload": payload,
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": f"{body.generations} рекомендаций", "amount": body.stars}],
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=data, timeout=10)
    resp = r.json()
    if not resp.get("ok"):
        logger.warning("createInvoiceLink failed: %s", resp)
        raise HTTPException(status_code=502, detail="Failed to create invoice")
    return {"invoice_link": resp["result"]}
