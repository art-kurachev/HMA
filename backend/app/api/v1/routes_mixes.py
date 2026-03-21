from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.llm_queue import run_through_llm_queue
from app.core.provider_router import (
    ensure_user_and_provider_group,
    generate_instruction_input,
    generate_mixes,
    generate_quick_mixes,
)
from app.core.quota import check_and_consume_quota, get_remaining_quota
from app.db.session import get_db
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import (
    InstructionRequest,
    MixItem,
    QuickSuggestRequest,
    SuggestRequest,
    SuggestResponse,
)
from app.utils.telegram_auth import resolve_telegram_id

router = APIRouter(prefix="/mixes", tags=["mixes"])

# Порядок для отображения: слева 4 табака, справа сверху 2, справа снизу 3
_DISPLAY_ORDER = (4, 2, 3)


def _reorder_mixes_for_display(mixes: list[MixItem]) -> list[MixItem]:
    """Сортировка: слева 4 табака, справа сверху 2, справа снизу 3."""
    by_count: dict[int, list[MixItem]] = {}
    for m in mixes:
        n = len(m.tobaccos) if m.tobaccos else 0
        by_count.setdefault(n, []).append(m)
    result = []
    for n in _DISPLAY_ORDER:
        if n in by_count and by_count[n]:
            result.append(by_count[n].pop(0))
    for items in by_count.values():
        result.extend(items)
    return result


@router.get("/quota")
async def get_quota(
    telegram_id: int = Query(..., description="Telegram user ID"),
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Return remaining requests: -1 = unlimited (creator), else 0–3 (welcome) or 0–1 (weekly)."""
    uid = resolve_telegram_id(x_telegram_init_data, telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)
    remaining, is_creator = await get_remaining_quota(db, user)
    return {"remaining": remaining, "is_creator": is_creator}


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_mixes(
    body: SuggestRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)
    allowed, provider_name, model_name = await check_and_consume_quota(db, user)
    if not allowed:
        raise HTTPException(status_code=429, detail="quota_exceeded")

    params = body.params.model_dump()
    provider, input_data = await generate_mixes(
        db,
        user,
        params,
        provider_name=provider_name,
        llm_model=model_name or None,
    )
    response = await run_through_llm_queue(provider.generate_mixes(input_data))

    from app.db.models import GeneratedMix, Session

    session = Session(user_id=user.id, params=params)
    db.add(session)
    await db.flush()
    mixes_out = []
    for mix in response.mixes:
        gm = GeneratedMix(
            session_id=session.id,
            mix_json=mix.model_dump(),
            provider=provider.__class__.__name__.replace("Provider", "").lower(),
            llm_model_used=model_name or None,
        )
        db.add(gm)
        await db.flush()
        mix_dict = mix.model_dump()
        mix_dict["mix_db_id"] = gm.id
        mixes_out.append(MixItem(**mix_dict))
    mixes_out = _reorder_mixes_for_display(mixes_out)
    return SuggestResponse(mixes=mixes_out, clarify=response.clarify)


@router.post("/quick-suggest", response_model=SuggestResponse)
async def quick_suggest_mixes(
    body: QuickSuggestRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Быстрый совет: 3 рандомных микса по цели вечера (без полного сетапа)."""
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)
    allowed, provider_name, model_name = await check_and_consume_quota(db, user)
    if not allowed:
        raise HTTPException(status_code=429, detail="quota_exceeded")

    from app.core.provider_router import QUICK_SUGGEST_MINIMAL_PARAMS
    from app.db.models import GeneratedMix, Session

    provider, input_data = await generate_quick_mixes(
        db,
        user,
        body.direction,
        body.no_tobacco,
        provider_name=provider_name,
        llm_model=model_name or None,
    )
    response = await run_through_llm_queue(provider.generate_mixes(input_data))

    session = Session(user_id=user.id, params=QUICK_SUGGEST_MINIMAL_PARAMS)
    db.add(session)
    await db.flush()
    mixes_out = []
    for mix in response.mixes:
        gm = GeneratedMix(
            session_id=session.id,
            mix_json=mix.model_dump(),
            provider=provider.__class__.__name__.replace("Provider", "").lower(),
            llm_model_used=model_name or None,
        )
        db.add(gm)
        await db.flush()
        mix_dict = mix.model_dump()
        mix_dict["mix_db_id"] = gm.id
        mixes_out.append(MixItem(**mix_dict))
    mixes_out = _reorder_mixes_for_display(mixes_out)
    return SuggestResponse(mixes=mixes_out, clarify=response.clarify)


@router.post("/{mix_id}/instruction", response_model=InstructionResponse)
async def get_instruction(
    mix_id: str,
    body: InstructionRequest,
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    uid = resolve_telegram_id(x_telegram_init_data, body.telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid)

    from sqlalchemy import select

    from app.db.models import GeneratedMix, Session

    mix_row = await db.execute(
        select(GeneratedMix, Session)
        .join(Session, GeneratedMix.session_id == Session.id)
        .where(Session.user_id == user.id)
        .order_by(GeneratedMix.created_at.desc())
    )
    row = None
    for gm, session in mix_row.all():
        if gm.mix_json.get("id") == mix_id:
            row = (gm, session)
            break
    if not row:
        # Fallback: look up mix in the user's shopping list
        from app.db.models import ShoppingList

        sl_result = await db.execute(
            select(ShoppingList).where(ShoppingList.user_id == user.id)
        )
        shopping_list = sl_result.scalar_one_or_none()
        sl_mix = None
        if shopping_list:
            sl_mix = next(
                (m for m in (shopping_list.mixes or []) if m.get("id") == mix_id),
                None,
            )
        if not sl_mix:
            raise HTTPException(status_code=404, detail="mix_not_found")

        # Consume quota — shopping list mixes weren't charged at suggest time
        allowed, _, _ = await check_and_consume_quota(db, user)
        if not allowed:
            raise HTTPException(status_code=429, detail="quota_exceeded")

        # Use latest session params for bowl/heat settings
        latest_session = await db.execute(
            select(Session)
            .where(Session.user_id == user.id)
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        latest_sess = latest_session.scalar_one_or_none()
        params = latest_sess.params if latest_sess else {}
        mix_data = sl_mix
    else:
        gm, session = row
        params = session.params or {}
        mix_data = gm.mix_json

    # Используем текущие настройки из админки (модель, провайдер), а не сохранённые в миксе
    provider, input_data = await generate_instruction_input(
        db,
        user,
        mix_data,
        params,
        provider_name=None,
        llm_model=None,
    )
    return await run_through_llm_queue(provider.generate_instruction(input_data))
