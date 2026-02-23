from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.app_settings import get_app_settings
from app.db.models import DailyUsage, User


async def check_and_increment_usage(db: AsyncSession, user_id: int) -> tuple[bool, int]:
    """
    Check if user is within daily limit and increment count.
    Returns (allowed, current_count).
    """
    app_cfg = await get_app_settings(db)
    disable = app_cfg.get("disable_daily_limit", "true").lower() == "true"
    limit = int(app_cfg.get("daily_request_limit", "5"))

    if disable:
        return True, 0
    today = date.today()
    row = await db.execute(
        select(DailyUsage).where(DailyUsage.user_id == user_id, DailyUsage.usage_date == today)
    )
    usage = row.scalar_one_or_none()
    if usage is None:
        usage = DailyUsage(user_id=user_id, usage_date=today, count=0)
        db.add(usage)
        await db.flush()
    if not disable and usage.count >= limit:
        return False, usage.count
    if not disable:
        usage.count += 1
    await db.flush()
    return True, usage.count


async def get_remaining_requests(db: AsyncSession, user_id: int) -> int:
    """Return remaining requests for today."""
    app_cfg = await get_app_settings(db)
    limit = int(app_cfg.get("daily_request_limit", "5"))
    today = date.today()
    row = await db.execute(
        select(DailyUsage.count).where(DailyUsage.user_id == user_id, DailyUsage.usage_date == today)
    )
    count = row.scalar_one_or_none() or 0
    return max(0, limit - count)
