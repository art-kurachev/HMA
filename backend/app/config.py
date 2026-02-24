from __future__ import annotations

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "sqlite+aiosqlite:///./hookah.db"
    LLM_PROVIDER: str = "mock"
    AB_SPLIT: int = 50
    DAILY_REQUEST_LIMIT: int = 5
    DISABLE_DAILY_LIMIT: bool = True

    # GigaChat
    GIGACHAT_AUTH_KEY: Optional[str] = None
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    GIGACHAT_MODEL: str = "GigaChat"

    # YandexGPT
    YANDEXGPT_API_KEY: Optional[str] = None
    YANDEXGPT_FOLDER_ID: Optional[str] = None
    YANDEXGPT_MODEL: str = "yandexgpt-lite/latest"

    # Telegram Bot (уведомления)
    BOT_TOKEN: Optional[str] = None

    # Creator (без лимитов) — comma-separated Telegram IDs
    CREATOR_TELEGRAM_IDS: str = ""

    # Admin
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin"
    ADMIN_JWT_SECRET: str = "change-me-in-production"
    ADMIN_JWT_ALGORITHM: str = "HS256"
    ADMIN_JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours


settings = Settings()
