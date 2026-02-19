from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "sqlite+aiosqlite:///./hookah.db"
    LLM_PROVIDER: str = "mock"
    AB_SPLIT: int = 50
    DAILY_REQUEST_LIMIT: int = 5
    DISABLE_DAILY_LIMIT: bool = True  # TODO: False при релизе + подключении нейросетей


settings = Settings()
