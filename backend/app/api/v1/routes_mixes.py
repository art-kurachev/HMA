from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

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

router = APIRouter(prefix="/mixes", tags=["mixes"])


@router.get("/quota")
async def get_quota(
    telegram_id: int = Query(..., description="Telegram user ID"),
    db: AsyncSession = Depends(get_db),
):
    """Return remaining requests: -1 = unlimited (creator), else 0–3 (welcome) or 0–1 (weekly)."""
    user = await ensure_user_and_provider_group(db, telegram_id)
    remaining, is_creator = await get_remaining_quota(db, user)
    return {"remaining": remaining, "is_creator": is_creator}


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_mixes(
    body: SuggestRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user_and_provider_group(db, body.telegram_id)
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
    return SuggestResponse(mixes=mixes_out, clarify=response.clarify)


@router.post("/quick-suggest", response_model=SuggestResponse)
async def quick_suggest_mixes(
    body: QuickSuggestRequest,
    db: AsyncSession = Depends(get_db),
):
    """Быстрый совет: 3 рандомных микса по цели вечера (без полного сетапа)."""
    user = await ensure_user_and_provider_group(db, body.telegram_id)
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
    return SuggestResponse(mixes=mixes_out, clarify=response.clarify)


@router.post("/{mix_id}/instruction", response_model=InstructionResponse)
async def get_instruction(
    mix_id: str,
    body: InstructionRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user_and_provider_group(db, body.telegram_id)

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
        raise HTTPException(status_code=404, detail="mix_not_found")

    gm, session = row
    params = session.params or {}
    mix_data = gm.mix_json

    provider, input_data = await generate_instruction_input(
        db,
        user,
        mix_data,
        params,
        provider_name=gm.provider,
        llm_model=gm.llm_model_used,
    )
    return await run_through_llm_queue(provider.generate_instruction(input_data))
