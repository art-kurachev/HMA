import random
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.app_settings import get_app_settings
from app.db.models import User
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.providers.gigachat import GigaChatProvider
from app.providers.mock import MockProvider
from app.providers.yandexgpt import YandexGPTProvider


def _get_provider_by_name(name: str, llm_model: str = "") -> BaseProvider:
    model = llm_model.strip() or None
    if name == "gigachat":
        return GigaChatProvider(model=model)
    if name == "yandexgpt":
        return YandexGPTProvider(model=model)
    return MockProvider()


async def ensure_user_and_provider_group(db: AsyncSession, telegram_id: int) -> User:
    from sqlalchemy import select

    row = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = row.scalar_one_or_none()
    if user is None:
        user = User(telegram_id=telegram_id)
        db.add(user)
        await db.flush()
    app_cfg = await get_app_settings(db)
    llm_provider = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
    if llm_provider == "ab" and user.provider_group is None:
        user.provider_group = "gigachat" if random.random() * 100 < settings.AB_SPLIT else "yandexgpt"
        await db.flush()
    return user


def get_provider_for_user(
    user: Optional[User],
    llm_provider: Optional[str] = None,
    llm_model: str = "",
) -> BaseProvider:
    provider_name = llm_provider or settings.LLM_PROVIDER
    if provider_name == "ab" and user and user.provider_group:
        provider_name = user.provider_group
    return _get_provider_by_name(provider_name, llm_model=llm_model)


async def generate_mixes(
    db: AsyncSession,
    user: User,
    params: dict,
) -> tuple[BaseProvider, MixProviderInput]:
    app_cfg = await get_app_settings(db)
    llm_provider = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
    llm_model = app_cfg.get("llm_model", "")
    provider = get_provider_for_user(user, llm_provider, llm_model)
    import re

    text = params.get("available_tobaccos_text", "")
    items = re.split(r"[,;/\n]+", text)
    tobaccos = [x.strip() for x in items if x.strip()][:20] or ["Black Nana", "Blue Horse", "Darkside Core"]
    input_data = MixProviderInput(params=params, available_tobaccos=tobaccos)
    return provider, input_data


async def generate_instruction_input(
    db: AsyncSession,
    user: User,
    mix: dict,
    params: dict,
) -> tuple[BaseProvider, InstructionProviderInput]:
    from app.schemas.mix import MixItem

    mix_item = MixItem(
        id=mix.get("id", "mix_1"),
        title=mix.get("title", ""),
        tobaccos=mix.get("tobaccos", []),
        flavor=mix.get("flavor", ""),
    )
    app_cfg = await get_app_settings(db)
    llm_provider = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
    llm_model = app_cfg.get("llm_model", "")
    provider = get_provider_for_user(user, llm_provider, llm_model)
    input_data = InstructionProviderInput(mix=mix_item, params=params)
    return provider, input_data
