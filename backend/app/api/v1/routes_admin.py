from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_auth import check_admin_credentials, create_admin_token, require_admin
from app.core.app_settings import get_app_settings, set_setting
from app.core.telegram import send_telegram_message
from app.db.models import AppSetting, DailyUsage, Feedback, GeneratedMix, Purchase, Session, User
from app.db.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str


class StarsPackage(BaseModel):
    generations: int
    stars: int


class SettingsUpdate(BaseModel):
    daily_request_limit: Optional[int] = None
    disable_daily_limit: Optional[bool] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    stars_packages: Optional[list[StarsPackage]] = None


class BroadcastRequest(BaseModel):
    """Разовая рассылка всем пользователям из БД (telegram_id)."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=3900,
        description="Текст; при parse_mode=HTML допустимы теги <b>, <i>, <a>.",
    )
    parse_mode: Optional[str] = Field(default=None, description="HTML | Markdown | MarkdownV2")
    idempotency_key: Optional[str] = Field(
        default=None,
        max_length=64,
        description="Если пусто — генерируется уникальный ключ (каждая рассылка независима).",
    )
    force: bool = Field(
        default=False,
        description="Игнорировать флаг «уже отправляли» и снова разослать всем.",
    )


@router.post("/login", response_model=LoginResponse)
async def admin_login(body: LoginRequest):
    if not check_admin_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return LoginResponse(token=create_admin_token())


@router.post("/broadcast")
async def admin_broadcast(
    body: BroadcastRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
):
    """
    Рассылка сообщения всем `users.telegram_id`.
    Один и тот же `idempotency_key` нельзя использовать повторно, пока в БД есть запись (кроме `force`).
    Пустой ключ — уникальный `auto_<uuid>` на каждый запрос.
    """
    if body.parse_mode is not None and body.parse_mode not in ("HTML", "Markdown", "MarkdownV2"):
        raise HTTPException(
            status_code=400,
            detail="parse_mode must be HTML, Markdown, MarkdownV2 or omitted",
        )
    raw_key = (body.idempotency_key or "").strip()
    effective_key = raw_key if raw_key else f"auto_{uuid.uuid4().hex}"
    setting_key = f"broadcast_{effective_key}"
    if not body.force:
        row = await db.execute(select(AppSetting).where(AppSetting.key == setting_key))
        if row.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=409,
                detail="broadcast_already_sent_for_this_key_use_force_true_to_repeat",
            )

    result = await db.execute(select(User.telegram_id))
    telegram_ids = [r[0] for r in result.all()]
    sent = 0
    failed = 0
    for tid in telegram_ids:
        ok = await send_telegram_message(tid, body.text, parse_mode=body.parse_mode)
        if ok:
            sent += 1
        else:
            failed += 1
        await asyncio.sleep(0.035)

    if sent > 0:
        await set_setting(db, setting_key, "1")
        await db.commit()
    else:
        await db.rollback()

    return {
        "sent": sent,
        "failed": failed,
        "total": len(telegram_ids),
        "idempotency_key": effective_key,
    }


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

    fb_pos = await db.execute(select(func.count(Feedback.id)).where(Feedback.rating.is_(True)))
    feedback_positive = fb_pos.scalar() or 0

    fb_neg = await db.execute(select(func.count(Feedback.id)).where(Feedback.rating.is_(False)))
    feedback_negative = fb_neg.scalar() or 0

    return {
        "users_count": total_users,
        "total_requests": total_requests,
        "total_attempts": int(total_attempts),
        "feedback_count": total_feedback,
        "feedback_positive": feedback_positive,
        "feedback_negative": feedback_negative,
    }


@router.get("/feedback")
async def admin_feedback_list(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Feedback, User.telegram_id, GeneratedMix.provider, GeneratedMix.llm_model_used)
        .join(User, Feedback.user_id == User.id)
        .outerjoin(GeneratedMix, Feedback.mix_id == GeneratedMix.id)
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
            "provider": provider or "—",
            "llm_model": llm_model or "—",
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f, tg_id, provider, llm_model in rows
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
        select(Session.user_id, func.count(Session.id).label("sessions_count")).group_by(Session.user_id)
    ).subquery()
    feedback_subq = (
        select(Feedback.user_id, func.count(Feedback.id).label("feedback_count")).group_by(Feedback.user_id)
    ).subquery()
    last_session_subq = (
        select(Session.user_id, func.max(Session.created_at).label("last_activity")).group_by(Session.user_id)
    ).subquery()

    purchases_subq = (
        select(
            Purchase.user_id,
            func.count(Purchase.id).label("purchases_count"),
            func.coalesce(func.sum(Purchase.stars_paid), 0).label("total_stars"),
        ).group_by(Purchase.user_id)
    ).subquery()

    q = (
        select(
            User.id,
            User.telegram_id,
            User.telegram_first_name,
            User.telegram_last_name,
            User.telegram_username,
            User.provider_group,
            User.created_at,
            User.paid_generations,
            User.friday_bonus,
            User.welcome_requests_used,
            func.coalesce(attempts_subq.c.attempts, 0).label("attempts"),
            func.coalesce(sessions_subq.c.sessions_count, 0).label("sessions_count"),
            func.coalesce(feedback_subq.c.feedback_count, 0).label("feedback_count"),
            last_session_subq.c.last_activity,
            func.coalesce(purchases_subq.c.purchases_count, 0).label("purchases_count"),
            func.coalesce(purchases_subq.c.total_stars, 0).label("total_stars"),
        )
        .outerjoin(attempts_subq, User.id == attempts_subq.c.id)
        .outerjoin(sessions_subq, User.id == sessions_subq.c.user_id)
        .outerjoin(feedback_subq, User.id == feedback_subq.c.user_id)
        .outerjoin(last_session_subq, User.id == last_session_subq.c.user_id)
        .outerjoin(purchases_subq, User.id == purchases_subq.c.user_id)
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
            "telegram_first_name": r.telegram_first_name,
            "telegram_last_name": r.telegram_last_name,
            "telegram_username": r.telegram_username,
            "provider_group": r.provider_group,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "attempts": int(r.attempts),
            "sessions_count": int(r.sessions_count),
            "feedback_count": int(r.feedback_count),
            "last_activity": r.last_activity.isoformat() if r.last_activity else None,
            "paid_generations": r.paid_generations or 0,
            "friday_bonus": r.friday_bonus or 0,
            "welcome_requests_used": r.welcome_requests_used or 0,
            "purchases_count": int(r.purchases_count),
            "total_stars": int(r.total_stars),
        }
        for r in rows
    ]


@router.get("/purchases")
async def admin_purchases_list(
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_admin),
    limit: int = 100,
    offset: int = 0,
    telegram_id: Optional[int] = None,
):
    q = select(Purchase).order_by(Purchase.created_at.desc())
    if telegram_id is not None:
        q = q.where(Purchase.telegram_id == telegram_id)
    q = q.limit(limit).offset(offset)
    result = await db.execute(q)
    rows = result.scalars().all()
    return [
        {
            "id": p.id,
            "telegram_id": p.telegram_id,
            "generations": p.generations,
            "stars_paid": p.stars_paid,
            "telegram_charge_id": p.telegram_charge_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in rows
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
    q = select(GeneratedMix.provider, func.count(GeneratedMix.id).label("count")).group_by(GeneratedMix.provider)
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
    import json

    cfg = await get_app_settings(db)
    raw = cfg.get("stars_packages", "[]")
    try:
        stars_packages = json.loads(raw)
    except json.JSONDecodeError:
        stars_packages = [{"generations": 1, "stars": 1}]
    return {
        "daily_request_limit": int(cfg.get("daily_request_limit", "5")),
        "disable_daily_limit": cfg.get("disable_daily_limit", "true").lower() == "true",
        "llm_provider": cfg.get("llm_provider", "mock"),
        "llm_model": cfg.get("llm_model", ""),
        "stars_packages": stars_packages,
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
        if body.llm_provider not in ("mock", "gigachat"):
            raise HTTPException(status_code=400, detail="llm_provider must be mock or gigachat")
        await set_setting(db, "llm_provider", body.llm_provider)
    if body.llm_model is not None:
        await set_setting(db, "llm_model", body.llm_model.strip())
    if body.stars_packages is not None:
        import json

        valid = []
        for p in body.stars_packages:
            g, s = p.generations, p.stars
            if isinstance(g, int) and isinstance(s, int) and g >= 1 and s >= 1:
                valid.append({"generations": g, "stars": s})
        if not valid:
            raise HTTPException(
                status_code=400, detail="stars_packages must have at least one package with generations>=1, stars>=1"
            )
        await set_setting(db, "stars_packages", json.dumps(valid))

    cfg = await get_app_settings(db)
    logger.info("Admin settings saved: llm_provider=%s llm_model=%s", cfg.get("llm_provider"), cfg.get("llm_model"))
    raw = cfg.get("stars_packages", "[]")
    try:
        stars_packages = json.loads(raw)
    except json.JSONDecodeError:
        stars_packages = [{"generations": 1, "stars": 1}]
    return {
        "daily_request_limit": int(cfg.get("daily_request_limit", "5")),
        "disable_daily_limit": cfg.get("disable_daily_limit", "true").lower() == "true",
        "llm_provider": cfg.get("llm_provider", "mock"),
        "llm_model": cfg.get("llm_model", ""),
        "stars_packages": stars_packages,
    }
