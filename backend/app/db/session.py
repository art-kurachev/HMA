from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.db.models import Base

_db_url = settings.DATABASE_URL
# Ensure async driver for Postgres (SQLAlchemy async needs asyncpg)
if _db_url.startswith("postgresql+psycopg"):
    _db_url = _db_url.replace("postgresql+psycopg", "postgresql+asyncpg", 1)
elif _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# SQLite needs check_same_thread=False for async
_engine_opts = {}
if "sqlite" in _db_url:
    _engine_opts["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(_db_url, echo=False, **_engine_opts)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def _run_migrations() -> None:
    from sqlalchemy import text

    for sql in [
        "ALTER TABLE users ADD COLUMN welcome_requests_used INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN last_weekly_refill DATE",
        "ALTER TABLE users ADD COLUMN friday_bonus INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN paid_generations INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN telegram_first_name VARCHAR(128)",
        "ALTER TABLE users ADD COLUMN telegram_last_name VARCHAR(128)",
        "ALTER TABLE users ADD COLUMN telegram_username VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN admin_bonus_generations INTEGER DEFAULT 0",
        "ALTER TABLE users ADD COLUMN quota_exempt BOOLEAN DEFAULT 0",
        "ALTER TABLE generated_mixes ADD COLUMN llm_model_used VARCHAR(64)",
    ]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(sql))
        except Exception:
            pass  # column may already exist


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await _run_migrations()
