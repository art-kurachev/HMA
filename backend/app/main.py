import logging
import traceback
from contextlib import asynccontextmanager

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.api.webhook_telegram import router as webhook_router
from app.config import settings
from app.core.app_settings import init_app_settings
from app.core.friday_refill import run_friday_refill
from app.db.session import async_session_maker, init_db

logger = logging.getLogger("uvicorn.error")


def _start_friday_scheduler() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_friday_refill,
        "cron",
        day_of_week="fri",
        hour=19,
        minute=0,
        id="friday_refill",
        timezone="Europe/Moscow",
    )
    scheduler.start()
    logger.info("Friday refill scheduler started (Fri 19:00 MSK)")


async def _register_telegram_webhook() -> None:
    if not settings.BOT_TOKEN or not settings.APP_URL:
        logger.info("Telegram webhook: BOT_TOKEN or APP_URL not set, skipping")
        return
    webhook_url = f"{settings.APP_URL.rstrip('/')}/webhook/telegram"
    api_url = f"https://api.telegram.org/bot{settings.BOT_TOKEN}/setWebhook"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(api_url, json={"url": webhook_url}, timeout=10)
            data = resp.json()
            if data.get("ok"):
                logger.info("Telegram webhook registered: %s", webhook_url)
            else:
                logger.warning("Telegram webhook registration failed: %s", data)
    except Exception as e:
        logger.warning("Telegram webhook registration error: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with async_session_maker() as session:
        try:
            await init_app_settings(session)
            await session.commit()
        except Exception:
            await session.rollback()
            raise
    _start_friday_scheduler()
    await _register_telegram_webhook()
    yield


app = FastAPI(title="Hookah Assistant API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.include_router(webhook_router)


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request, exc: RuntimeError):
    """LLM-провайдеры кидают RuntimeError при проблемах с ключами — отдаём 503 с понятным сообщением."""
    msg = str(exc)
    if "GIGACHAT_AUTH_KEY" in msg or "API" in msg:
        logger.warning("LLM provider error: %s", msg)
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=503,
            content={"detail": msg},
        )
    raise exc


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Логируем необработанные исключения. httpx-ошибки LLM — 503 с понятным сообщением."""
    logger.error(
        "Internal Server Error: %s\n%s",
        exc,
        traceback.format_exc(),
    )
    from fastapi.responses import JSONResponse

    msg = str(exc)
    if "httpx" in type(exc).__module__:
        if "404" in msg:
            detail = "GigaChat API: модель недоступна (404). Попробуйте GigaChat в админке."
        elif "401" in msg or "403" in msg:
            detail = "Ошибка авторизации GigaChat. Проверьте GIGACHAT_AUTH_KEY в .env."
        elif "Timeout" in type(exc).__name__ or "timeout" in msg.lower():
            detail = "GigaChat недоступен: таймаут подключения. Проверьте интернет или попробуйте позже."
        else:
            detail = f"Ошибка LLM API: {msg[:200]}"
        return JSONResponse(status_code=503, content={"detail": detail})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": msg},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
