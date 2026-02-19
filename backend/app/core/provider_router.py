import random
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import User
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.providers.gigachat import GigaChatProvider
from app.providers.mock import MockProvider
from app.providers.yandexgpt import YandexGPTProvider


def _get_provider_by_name(name: str) -> BaseProvider:
    if name == "gigachat":
        return GigaChatProvider()
    if name == "yandexgpt":
        return YandexGPTProvider()
    return MockProvider()


async def ensure_user_and_provider_group(db: AsyncSession, telegram_id: int) -> User:
    from sqlalchemy import select

    row = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = row.scalar_one_or_none()
    if user is None:
        user = User(telegram_id=telegram_id)
        db.add(user)
        await db.flush()
    if settings.LLM_PROVIDER == "ab" and user.provider_group is None:
        user.provider_group = "gigachat" if random.random() * 100 < settings.AB_SPLIT else "yandexgpt"
        await db.flush()
    return user


def get_provider_for_user(user: Optional[User]) -> BaseProvider:
    provider_name = settings.LLM_PROVIDER
    if provider_name == "ab" and user and user.provider_group:
        provider_name = user.provider_group
    return _get_provider_by_name(provider_name)


async def generate_mixes(
    db: AsyncSession,
    user: User,
    params: dict,
) -> tuple[BaseProvider, MixProviderInput]:
    provider = get_provider_for_user(user)
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
    from app.schemas.mix import MixCompositionItem, MixItem

    mix_item = MixItem(
        id=mix.get("id", "mix_1"),
        title=mix.get("title", ""),
        composition=[MixCompositionItem(name=c["name"], percent=c["percent"]) for c in mix.get("composition", [])],
        why=mix.get("why", []),
    )
    provider = get_provider_for_user(user)
    input_data = InstructionProviderInput(mix=mix_item, params=params)
    return provider, input_data
