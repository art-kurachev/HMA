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


settings = Settings()
