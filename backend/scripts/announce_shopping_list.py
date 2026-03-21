"""
Разовое уведомление о релизе «Список покупок».

Запуск из папки backend/:
    python -m scripts.announce_shopping_list

Скрипт отправляет сообщение всем пользователям и завершается.
Запускать один раз при релизе.
"""

import asyncio
import logging

from sqlalchemy import select

from app.core.telegram import send_telegram_message
from app.core.quota import is_creator
from app.db.models import User
from app.db.session import async_session_maker

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

MESSAGE = """Привет! Я обновил приложение и добавил список покупок 🛒

Теперь не нужно думать, запоминать или записывать, какие табаки брать в магазине — приложение само генерирует 10 миксов и выдаёт список табаков для них.
(Одна генерация 10 миксов = 1 попытка)

Заходишь в магазин — открываешь список, генерируешь, отмечаешь, что взял. Сразу видно, сколько миксов можно собрать из купленного табака 🔥

Если на микс хватает — прямо из списка можно открыть инструкцию и начать забивать 💨

Кнопка с иконкой «Список покупок» — на главном экране.
Пользуйся и пиши фидбек 🙌"""


async def main() -> None:
    async with async_session_maker() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

    sent = 0
    failed = 0
    for user in users:
        if is_creator(user.telegram_id):
            continue
        try:
            await send_telegram_message(user.telegram_id, MESSAGE)
            logger.info("Sent to %s", user.telegram_id)
            sent += 1
        except Exception as e:
            logger.warning("Failed for %s: %s", user.telegram_id, e)
            failed += 1
        await asyncio.sleep(0.05)  # не спамим в TG API

    logger.info("Done. Sent: %d, Failed: %d", sent, failed)


if __name__ == "__main__":
    asyncio.run(main())
