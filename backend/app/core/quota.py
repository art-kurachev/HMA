"""Quota: 3 welcome + 1/week + friday_bonus + paid + admin_bonus_generations. Creator unlimited.
Глобально: DISABLE_DAILY_LIMIT / disable_daily_limit в админке.
По пользователю: quota_exempt — без лимита; admin_bonus_generations — как платные, расходуются первыми после friday/paid."""

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import User

WELCOME_QUOTA = 3
WEEKLY_REFILL_DAYS = 7


def _creator_ids() -> set[int]:
    ids = set()
    for s in (settings.CREATOR_TELEGRAM_IDS or "").split(","):
        s = s.strip()
        if s.isdigit():
            ids.add(int(s))
    return ids


def is_creator(telegram_id: int) -> bool:
    return telegram_id in _creator_ids()


async def check_and_consume_quota(
    db: AsyncSession,
    user: User,
) -> tuple[bool, str, str]:
    """
    Check if user can make a suggest request and consume quota.
    Returns (allowed, provider_for_mix, model_for_mix).
    Если лимит отключён (DISABLE_DAILY_LIMIT в .env или disable_daily_limit в БД) — всегда разрешаем.
    """
    from app.core.app_settings import get_app_settings

    app_cfg = await get_app_settings(db)
    limit_disabled = settings.DISABLE_DAILY_LIMIT or app_cfg.get("disable_daily_limit", "true").lower() == "true"
    if limit_disabled:
        m = _admin_model(app_cfg)
        return True, _admin_provider(app_cfg, user), m if m else None

    if getattr(user, "quota_exempt", False):
        app_cfg = await get_app_settings(db)
        m = _admin_model(app_cfg)
        return True, _admin_provider(app_cfg, user), m if m else None

    if is_creator(user.telegram_id):
        app_cfg = await get_app_settings(db)
        llm_provider = app_cfg.get("llm_provider", "gigachat")
        llm_model = app_cfg.get("llm_model", "") or None
        if llm_provider != "gigachat":
            return True, llm_provider, llm_model or ""
        return True, "gigachat", llm_model or settings.GIGACHAT_MODEL

    # Friday bonus: consume first — провайдер и модель из админки (как weekly)
    bonus = getattr(user, "friday_bonus", 0) or 0
    if bonus > 0:
        user.friday_bonus = bonus - 1
        await db.flush()
        app_cfg = await get_app_settings(db)
        return True, _admin_provider(app_cfg, user), _admin_model(app_cfg)

    # Paid generations (куплено за Stars)
    paid = getattr(user, "paid_generations", 0) or 0
    if paid > 0:
        user.paid_generations = paid - 1
        await db.flush()
        app_cfg = await get_app_settings(db)
        return True, _admin_provider(app_cfg, user), _admin_model(app_cfg)

    admin_bonus = getattr(user, "admin_bonus_generations", 0) or 0
    if admin_bonus > 0:
        user.admin_bonus_generations = admin_bonus - 1
        await db.flush()
        app_cfg = await get_app_settings(db)
        return True, _admin_provider(app_cfg, user), _admin_model(app_cfg)

    # Welcome phase: first 3 requests — используем провайдер из настроек (в т.ч. mock)
    if user.welcome_requests_used < WELCOME_QUOTA:
        user.welcome_requests_used += 1
        await db.flush()
        app_cfg = await get_app_settings(db)
        m = _admin_model(app_cfg)
        return True, _admin_provider(app_cfg, user), m if m else None

    # Weekly phase: 1 request per 7 days
    app_cfg = await get_app_settings(db)
    today = date.today()
    if user.last_weekly_refill is None:
        user.last_weekly_refill = today
        await db.flush()
        return True, _admin_provider(app_cfg, user), _admin_model(app_cfg)

    days_since = (today - user.last_weekly_refill).days
    if days_since >= WEEKLY_REFILL_DAYS:
        user.last_weekly_refill = today
        await db.flush()
        return True, _admin_provider(app_cfg, user), _admin_model(app_cfg)

    return False, "", ""


async def get_remaining_quota(db: AsyncSession, user: User) -> tuple[int, bool]:
    """
    Returns (remaining, is_creator).
    remaining: -1 = unlimited (creator, quota_exempt, или лимит отключён глобально).
    Иначе — сумма доступных генераций по welcome/weekly/friday/paid/admin_bonus.
    """
    from app.core.app_settings import get_app_settings

    app_cfg = await get_app_settings(db)
    limit_disabled = settings.DISABLE_DAILY_LIMIT or app_cfg.get("disable_daily_limit", "true").lower() == "true"
    if limit_disabled:
        return -1, False

    if getattr(user, "quota_exempt", False):
        return -1, False

    if is_creator(user.telegram_id):
        return -1, True

    bonus = getattr(user, "friday_bonus", 0) or 0
    paid = getattr(user, "paid_generations", 0) or 0
    admin_b = getattr(user, "admin_bonus_generations", 0) or 0
    extra = bonus + paid + admin_b

    if user.welcome_requests_used < WELCOME_QUOTA:
        return extra + (WELCOME_QUOTA - user.welcome_requests_used), False

    today = date.today()
    if user.last_weekly_refill is None:
        return extra + 1, False
    days_since = (today - user.last_weekly_refill).days
    if days_since >= WEEKLY_REFILL_DAYS:
        return extra + 1, False
    return extra + 0, False


def _admin_provider(app_cfg: dict, user: User) -> str:
    p = app_cfg.get("llm_provider", "gigachat")
    if p == "ab" and user.provider_group:
        return user.provider_group
    if p == "ab":
        return "gigachat"
    return p


def _admin_model(app_cfg: dict) -> str:
    return app_cfg.get("llm_model", "").strip() or ""
