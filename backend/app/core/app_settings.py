"""Runtime app settings stored in DB with fallback to env.
После первого запуска значения берутся из БД (админка); .env используется только как дефолт при первом seed.
Исключение: лимит рекомендаций (quota) дополнительно читает DISABLE_DAILY_LIMIT из .env при каждом запросе."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import AppSetting

_SETTINGS_KEYS = ("daily_request_limit", "disable_daily_limit", "llm_provider", "llm_model")

_DEFAULTS = {
    "daily_request_limit": str(settings.DAILY_REQUEST_LIMIT),
    "disable_daily_limit": str(settings.DISABLE_DAILY_LIMIT).lower(),
    "llm_provider": settings.LLM_PROVIDER,
    "llm_model": "",  # пусто = из .env
}


async def get_app_settings(db: AsyncSession) -> dict[str, str]:
    """Load runtime settings from DB, fill gaps from env."""
    result = await db.execute(select(AppSetting).where(AppSetting.key.in_(_SETTINGS_KEYS)))
    rows = result.scalars().all()
    out = dict(_DEFAULTS)
    for row in rows:
        out[row.key] = row.value
    return out


async def get_setting(db: AsyncSession, key: str) -> str:
    """Get single setting value."""
    settings_map = await get_app_settings(db)
    return settings_map.get(key, _DEFAULTS.get(key, ""))


async def set_setting(db: AsyncSession, key: str, value: str) -> None:
    """Set a runtime setting in DB."""
    row = await db.execute(select(AppSetting).where(AppSetting.key == key))
    existing = row.scalar_one_or_none()
    if existing:
        existing.value = value
    else:
        db.add(AppSetting(key=key, value=value))
    await db.flush()


async def init_app_settings(db: AsyncSession) -> None:
    """Seed app_settings from env on first run."""
    existing = await db.execute(select(AppSetting).limit(1))
    if existing.scalar_one_or_none():
        return
    for key, value in _DEFAULTS.items():
        db.add(AppSetting(key=key, value=value))
    await db.flush()
