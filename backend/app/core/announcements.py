"""Разовые анонсы при релизе — отправляются автоматически при старте, если ещё не отправлялись."""

import asyncio
import logging

from sqlalchemy import select

from app.core.app_settings import get_setting, set_setting
from app.core.quota import is_creator
from app.core.telegram import send_telegram_message
from app.db.models import User
from app.db.session import async_session_maker

logger = logging.getLogger("uvicorn.error")

ANNOUNCEMENTS = [
    {
        "key": "announce_shopping_list_sent",
        "message": (
            "Привет! Я обновил приложение и добавил список покупок 🛒\n\n"
            "Теперь не нужно думать, запоминать или записывать, какие табаки брать в магазине — "
            "приложение само генерирует 10 миксов и выдаёт список табаков для них.\n"
            "(Одна генерация 10 миксов = 1 попытка)\n\n"
            "Заходишь в магазин — открываешь список, генерируешь, отмечаешь, что взял. "
            "Сразу видно, сколько миксов можно собрать из купленного табака 🔥\n\n"
            "Если на микс хватает — прямо из списка можно открыть инструкцию и начать забивать 💨\n\n"
            "Кнопка с иконкой «Список покупок» — на главном экране.\n"
            "Пользуйся и пиши фидбек 🙌"
        ),
    },
]


async def run_announcements() -> None:
    """При старте проверяет и отправляет неотправленные анонсы."""
    async with async_session_maker() as db:
        for announce in ANNOUNCEMENTS:
            key = announce["key"]
            already_sent = await get_setting(db, key)
            if already_sent == "true":
                continue

            result = await db.execute(select(User))
            users = result.scalars().all()

            sent = 0
            for user in users:
                if is_creator(user.telegram_id):
                    continue
                try:
                    await send_telegram_message(user.telegram_id, announce["message"])
                    sent += 1
                except Exception as e:
                    logger.warning("Announce failed for %s: %s", user.telegram_id, e)
                await asyncio.sleep(0.05)

            await set_setting(db, key, "true")
            await db.commit()
            logger.info("Announcement '%s' sent to %d users", key, sent)
