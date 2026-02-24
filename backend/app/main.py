from contextlib import asynccontextmanager
import logging
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.app_settings import init_app_settings
from app.db.session import async_session_maker, init_db

logger = logging.getLogger("uvicorn.error")


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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Логируем необработанные исключения — в консоли будет видна причина 500."""
    logger.error(
        "Internal Server Error: %s\n%s",
        exc,
        traceback.format_exc(),
    )
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
