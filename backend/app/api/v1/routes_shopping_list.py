from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.llm_queue import run_through_llm_queue
from app.core.prompt_builder import build_shopping_list_prompt
from app.core.provider_router import ensure_user_and_provider_group, get_provider_for_user
from app.core.quota import check_and_consume_quota
from app.db.models import ShoppingList
from app.db.session import get_db
from app.providers.base import MixProviderInput
from app.schemas.shopping_list import (
    GenerateShoppingListRequest,
    ShoppingListResponse,
    ShoppingMixItem,
    UpdateCheckedRequest,
)
from app.utils.telegram_auth import resolve_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shopping-list", tags=["shopping-list"])


@router.get("/", response_model=ShoppingListResponse)
async def get_shopping_list(
    telegram_id: int,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Получить текущий список покупок пользователя."""
    uid = resolve_telegram_id(x_telegram_init_data, telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)

    row = await db.execute(select(ShoppingList).where(ShoppingList.user_id == user.id))
    shopping_list = row.scalar_one_or_none()

    if shopping_list is None:
        raise HTTPException(status_code=404, detail="shopping_list_not_found")

    return ShoppingListResponse(
        mixes=[ShoppingMixItem(**m) for m in shopping_list.mixes],
        checked_tobaccos=shopping_list.checked_tobaccos or [],
        updated_at=shopping_list.updated_at,
    )


@router.post("/generate", response_model=ShoppingListResponse)
async def generate_shopping_list(
    body: GenerateShoppingListRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Сгенерировать список покупок (10 миксов). Расходует квоту."""
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)

    allowed, provider_name, model_name = await check_and_consume_quota(db, user)
    if not allowed:
        raise HTTPException(status_code=429, detail="quota_exceeded")

    from app.core.app_settings import get_app_settings

    app_cfg = await get_app_settings(db)
    provider = get_provider_for_user(
        user,
        provider_name or app_cfg.get("llm_provider", settings.LLM_PROVIDER),
        model_name or app_cfg.get("llm_model", ""),
    )

    prompt = build_shopping_list_prompt()
    input_data = MixProviderInput(
        params={"_shopping_list": True},
        available_tobaccos=[],
        custom_prompt=prompt,
    )

    response = await run_through_llm_queue(provider.generate_mixes(input_data))

    mixes = [m.model_dump() for m in response.mixes]
    if len(mixes) < 10:
        logger.warning("Shopping list: got %d mixes instead of 10", len(mixes))

    # Upsert: один список на пользователя
    row = await db.execute(select(ShoppingList).where(ShoppingList.user_id == user.id))
    shopping_list = row.scalar_one_or_none()

    if shopping_list is None:
        shopping_list = ShoppingList(user_id=user.id, mixes=mixes, checked_tobaccos=[])
        db.add(shopping_list)
    else:
        shopping_list.mixes = mixes
        shopping_list.checked_tobaccos = []
        from datetime import datetime
        shopping_list.updated_at = datetime.utcnow()

    await db.flush()

    return ShoppingListResponse(
        mixes=[ShoppingMixItem(**m) for m in mixes],
        checked_tobaccos=[],
        updated_at=shopping_list.updated_at,
    )


@router.patch("/check", response_model=ShoppingListResponse)
async def update_checked(
    body: UpdateCheckedRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Обновить список отмеченных (купленных) табаков."""
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)

    row = await db.execute(select(ShoppingList).where(ShoppingList.user_id == user.id))
    shopping_list = row.scalar_one_or_none()

    if shopping_list is None:
        raise HTTPException(status_code=404, detail="shopping_list_not_found")

    shopping_list.checked_tobaccos = body.checked_tobaccos
    from datetime import datetime
    shopping_list.updated_at = datetime.utcnow()
    await db.flush()

    return ShoppingListResponse(
        mixes=[ShoppingMixItem(**m) for m in shopping_list.mixes],
        checked_tobaccos=shopping_list.checked_tobaccos,
        updated_at=shopping_list.updated_at,
    )
