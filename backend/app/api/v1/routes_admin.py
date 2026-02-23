from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_auth import check_admin_credentials, create_admin_token, require_admin
from app.core.app_settings import get_app_settings, set_setting
from app.db.models import DailyUsage, Feedback, GeneratedMix, Session, User
from app.db.session import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


class SettingsUpdate(BaseModel):
    daily_request_limit: Optional[int] = None
    disable_daily_limit: Optional[bool] = None
    llm_provider: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def admin_login(body: LoginRequest):
    if not check_admin_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return LoginResponse(token=create_admin_token())


@router.get("/stats")
async def admin_stats(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar() or 0

    sessions_count = await db.execute(select(func.count(Session.id)))
    total_requests = sessions_count.scalar() or 0

    usage_total = await db.execute(select(func.sum(DailyUsage.count)))
    total_attempts = usage_total.scalar() or 0

    feedback_count = await db.execute(select(func.count(Feedback.id)))
    total_feedback = feedback_count.scalar() or 0

    return {
        "users_count": total_users,
        "total_requests": total_requests,
        "total_attempts": int(total_attempts),
        "feedback_count": total_feedback,
    }


@router.get("/feedback")
async def admin_feedback_list(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Feedback, User.telegram_id)
        .join(User, Feedback.user_id == User.id)
        .order_by(Feedback.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    return [
        {
            "id": f.id,
            "mix_id": f.mix_id,
            "telegram_id": tg_id,
            "rating": f.rating,
            "reason": f.reason,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f, tg_id in rows
    ]


@router.get("/users")
async def admin_users_list(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    limit: int = 200,
    offset: int = 0,
):
    # Users with attempts (sum of daily_usage.count), sessions count, feedback count
    attempts_subq = (
        select(User.id, func.coalesce(func.sum(DailyUsage.count), 0).label("attempts"))
        .outerjoin(DailyUsage, User.id == DailyUsage.user_id)
        .group_by(User.id)
    ).subquery()
    sessions_subq = (
        select(Session.user_id, func.count(Session.id).label("sessions_count"))
        .group_by(Session.user_id)
    ).subquery()
    feedback_subq = (
        select(Feedback.user_id, func.count(Feedback.id).label("feedback_count"))
        .group_by(Feedback.user_id)
    ).subquery()
    last_session_subq = (
        select(Session.user_id, func.max(Session.created_at).label("last_activity"))
        .group_by(Session.user_id)
    ).subquery()

    q = (
        select(
            User.id,
            User.telegram_id,
            User.provider_group,
            User.created_at,
            func.coalesce(attempts_subq.c.attempts, 0).label("attempts"),
            func.coalesce(sessions_subq.c.sessions_count, 0).label("sessions_count"),
            func.coalesce(feedback_subq.c.feedback_count, 0).label("feedback_count"),
            last_session_subq.c.last_activity,
        )
        .outerjoin(attempts_subq, User.id == attempts_subq.c.id)
        .outerjoin(sessions_subq, User.id == sessions_subq.c.user_id)
        .outerjoin(feedback_subq, User.id == feedback_subq.c.user_id)
        .outerjoin(last_session_subq, User.id == last_session_subq.c.user_id)
        .order_by(User.id.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "id": r.id,
            "telegram_id": r.telegram_id,
            "provider_group": r.provider_group,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "attempts": int(r.attempts),
            "sessions_count": int(r.sessions_count),
            "feedback_count": int(r.feedback_count),
            "last_activity": r.last_activity.isoformat() if r.last_activity else None,
        }
        for r in rows
    ]


@router.get("/mixes/{mix_id}")
async def admin_get_mix(
    mix_id: int,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    row = await db.execute(select(GeneratedMix).where(GeneratedMix.id == mix_id))
    mix = row.scalar_one_or_none()
    if not mix:
        raise HTTPException(status_code=404, detail="mix_not_found")
    return {
        "id": mix.id,
        "mix_json": mix.mix_json,
        "provider": mix.provider,
        "created_at": mix.created_at.isoformat() if mix.created_at else None,
    }


@router.get("/activity")
async def admin_activity(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    days: int = 14,
):
    from datetime import datetime, timedelta

    start = datetime.utcnow().date() - timedelta(days=days)
    q = (
        select(DailyUsage.usage_date, func.sum(DailyUsage.count).label("total"))
        .where(DailyUsage.usage_date >= start)
        .group_by(DailyUsage.usage_date)
        .order_by(DailyUsage.usage_date)
    )
    result = await db.execute(q)
    rows = result.all()
    return [{"date": str(r.usage_date), "requests": int(r.total)} for r in rows]


@router.get("/providers")
async def admin_providers_stats(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    q = (
        select(GeneratedMix.provider, func.count(GeneratedMix.id).label("count"))
        .group_by(GeneratedMix.provider)
    )
    result = await db.execute(q)
    rows = result.all()
    return [{"provider": r.provider, "count": r.count} for r in rows]


@router.get("/mixes")
async def admin_mixes_list(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    limit: int = 100,
    offset: int = 0,
):
    q = (
        select(GeneratedMix, User.telegram_id)
        .join(Session, GeneratedMix.session_id == Session.id)
        .join(User, Session.user_id == User.id)
        .order_by(GeneratedMix.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "id": gm.id,
            "telegram_id": tg_id,
            "title": gm.mix_json.get("title", ""),
            "flavor": gm.mix_json.get("flavor", ""),
            "provider": gm.provider,
            "created_at": gm.created_at.isoformat() if gm.created_at else None,
        }
        for gm, tg_id in rows
    ]


@router.get("/settings")
async def admin_get_settings(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    cfg = await get_app_settings(db)
    return {
        "daily_request_limit": int(cfg.get("daily_request_limit", "5")),
        "disable_daily_limit": cfg.get("disable_daily_limit", "true").lower() == "true",
        "llm_provider": cfg.get("llm_provider", "mock"),
    }


@router.patch("/settings")
async def admin_update_settings(
    body: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    if body.daily_request_limit is not None:
        if body.daily_request_limit < 1 or body.daily_request_limit > 100:
            raise HTTPException(status_code=400, detail="daily_request_limit must be 1-100")
        await set_setting(db, "daily_request_limit", str(body.daily_request_limit))
    if body.disable_daily_limit is not None:
        await set_setting(db, "disable_daily_limit", str(body.disable_daily_limit).lower())
    if body.llm_provider is not None:
        if body.llm_provider not in ("mock", "gigachat", "yandexgpt", "ab"):
            raise HTTPException(status_code=400, detail="llm_provider must be mock, gigachat, yandexgpt, or ab")
        await set_setting(db, "llm_provider", body.llm_provider)
    cfg = await get_app_settings(db)
    return {
        "daily_request_limit": int(cfg.get("daily_request_limit", "5")),
        "disable_daily_limit": cfg.get("disable_daily_limit", "true").lower() == "true",
        "llm_provider": cfg.get("llm_provider", "mock"),
    }
