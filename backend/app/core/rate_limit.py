from datetime import date, datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import DailyUsage, User


async def check_and_increment_usage(db: AsyncSession, user_id: int) -> tuple[bool, int]:
    """
    Check if user is within daily limit and increment count.
    Returns (allowed, current_count).
    """
    today = date.today()
    row = await db.execute(
        select(DailyUsage).where(DailyUsage.user_id == user_id, DailyUsage.usage_date == today)
    )
    usage = row.scalar_one_or_none()
    if usage is None:
        usage = DailyUsage(user_id=user_id, usage_date=today, count=0)
        db.add(usage)
        await db.flush()
    if usage.count >= settings.DAILY_REQUEST_LIMIT:
        return False, usage.count
    usage.count += 1
    await db.flush()
    return True, usage.count


async def get_remaining_requests(db: AsyncSession, user_id: int) -> int:
    """Return remaining requests for today."""
    today = date.today()
    row = await db.execute(
        select(DailyUsage.count).where(DailyUsage.user_id == user_id, DailyUsage.usage_date == today)
    )
    count = row.scalar_one_or_none() or 0
    return max(0, settings.DAILY_REQUEST_LIMIT - count)
