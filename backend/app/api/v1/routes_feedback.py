from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Feedback as FeedbackModel
from app.db.models import GeneratedMix, Session, User
from app.db.session import get_db
from app.schemas.feedback import FeedbackRequest

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/")
async def submit_feedback(
    body: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    user_row = await db.execute(select(User).where(User.telegram_id == body.telegram_id))
    user = user_row.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="user_not_found")

    mix_row = await db.execute(
        select(GeneratedMix)
        .join(Session, GeneratedMix.session_id == Session.id)
        .where(GeneratedMix.id == body.mix_db_id, Session.user_id == user.id)
    )
    mix = mix_row.scalar_one_or_none()
    if not mix:
        raise HTTPException(status_code=404, detail="mix_not_found")

    feedback = FeedbackModel(
        mix_id=body.mix_db_id,
        user_id=user.id,
        rating=body.rating,
        reason=body.reason,
    )
    db.add(feedback)
    await db.flush()
    return {"ok": True}
