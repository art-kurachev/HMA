from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.provider_router import (
    ensure_user_and_provider_group,
    generate_instruction_input,
    generate_mixes,
)
from app.core.rate_limit import check_and_increment_usage
from app.db.session import get_db
from app.schemas.feedback import FeedbackRequest
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import InstructionRequest, MixItem, SuggestRequest, SuggestResponse

router = APIRouter(prefix="/mixes", tags=["mixes"])


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_mixes(
    body: SuggestRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await ensure_user_and_provider_group(db, body.telegram_id)
    allowed, _ = await check_and_increment_usage(db, user.id)
    if not allowed:
        raise HTTPException(status_code=429, detail="daily_limit_exceeded")

    params = body.params.model_dump()
    provider, input_data = await generate_mixes(db, user, params)
    response = await provider.generate_mixes(input_data)

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
    allowed, _ = await check_and_increment_usage(db, user.id)
    if not allowed:
        raise HTTPException(status_code=429, detail="daily_limit_exceeded")

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

    provider, input_data = await generate_instruction_input(db, user, mix_data, params)
    return await provider.generate_instruction(input_data)
