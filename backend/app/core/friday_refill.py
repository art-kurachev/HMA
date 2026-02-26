"""Пятничный бонус: каждую пятницу 19:00 +1 генерация пользователям с остатком ≤3."""

import logging

from sqlalchemy import select

from app.core.app_settings import get_app_settings
from app.core.quota import get_remaining_quota, is_creator
from app.core.telegram import send_telegram_message
from app.db.models import User
from app.db.session import async_session_maker

logger = logging.getLogger("uvicorn.error")

MSG_ADDED = "🎉 Вам добавлена 1 бесплатная генерация! Заходи миксуй 🍃"
MSG_REMINDER = "Привет! Мы тут — заходи миксуй 🍃"


async def run_friday_refill() -> None:
    """
    Вызывается каждую пятницу в 19:00.
    Пользователям с остатком ≤3 — +1 в friday_bonus.
    Всем — уведомление: если добавили — упоминаем, если нет — просто напоминание.
    """
    async with async_session_maker() as db:
        try:
            app_cfg = await get_app_settings(db)
            limit_disabled = app_cfg.get("disable_daily_limit", "true").lower() == "true"
            if limit_disabled:
                logger.info("Friday refill skipped: daily limit disabled")
                return

            result = await db.execute(select(User))
            users = result.scalars().all()

            for user in users:
                if is_creator(user.telegram_id):
                    continue
                remaining, _ = await get_remaining_quota(db, user)
                bonus = getattr(user, "friday_bonus", 0) or 0
                total = remaining if remaining >= 0 else 0
                if total > 3:
                    # Не добавляем, только напоминание
                    await send_telegram_message(user.telegram_id, MSG_REMINDER)
                else:
                    user.friday_bonus = bonus + 1
                    await db.flush()
                    await send_telegram_message(user.telegram_id, MSG_ADDED)

            await db.commit()
            logger.info("Friday refill done for %d users", len(users))
        except Exception:
            await db.rollback()
            logger.exception("Friday refill failed")
            raise
