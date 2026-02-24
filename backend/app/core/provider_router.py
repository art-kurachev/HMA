from __future__ import annotations

import logging
import random

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.app_settings import get_app_settings
from app.db.models import User
from app.core.prompt_builder import build_quick_mixes_prompt
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.providers.gigachat import GigaChatProvider
from app.providers.mock import MockProvider
from app.providers.yandexgpt import YandexGPTProvider

logger = logging.getLogger(__name__)


def _get_provider_by_name(name: str, llm_model: str = "") -> BaseProvider:
    model = llm_model.strip() or None
    if name == "gigachat":
        if not settings.GIGACHAT_AUTH_KEY:
            logger.warning("GIGACHAT_AUTH_KEY не задан в .env — используем mock-провайдер")
            return MockProvider()
        return GigaChatProvider(model=model)
    if name == "yandexgpt":
        if not settings.YANDEXGPT_API_KEY or not settings.YANDEXGPT_FOLDER_ID:
            logger.warning("YandexGPT API key или folder_id не заданы в .env — используем mock-провайдер")
            return MockProvider()
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
    user: User | None,
    llm_provider: str | None = None,
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
    *,
    provider_name: str | None = None,
    llm_model: str | None = None,
) -> tuple[BaseProvider, MixProviderInput]:
    """provider_name and llm_model override admin settings (used by quota system)."""
    if provider_name is not None:
        provider = _get_provider_by_name(provider_name, llm_model=llm_model or "")
    else:
        app_cfg = await get_app_settings(db)
        p = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
        m = llm_model or app_cfg.get("llm_model", "")
        provider = get_provider_for_user(user, p, m)
    import re

    text = params.get("available_tobaccos_text", "")
    items = re.split(r"[,;/\n]+", text)
    tobaccos = [x.strip() for x in items if x.strip()][:20] or ["Black Nana", "Blue Horse", "Darkside Core"]
    input_data = MixProviderInput(params=params, available_tobaccos=tobaccos)
    return provider, input_data


# Дефолтные параметры сетапа для быстрого совета (инструкция потом строится по ним).
QUICK_SUGGEST_MINIMAL_PARAMS: dict = {
    "bowl": "phunnel",
    "heat_control": "kaloud",
    "has_cap": True,
    "coal_size": 25,
    "coal_count_start": 3,
    "strength": "medium",
    "profiles": [],
    "available_tobaccos_text": "",
}


async def generate_quick_mixes(
    db: AsyncSession,
    user: User,
    direction: str,
    no_tobacco: bool,
    *,
    provider_name: str | None = None,
    llm_model: str | None = None,
) -> tuple[BaseProvider, MixProviderInput]:
    """Быстрый совет: 3 микса по цели вечера, без полного сетапа."""
    if provider_name is not None:
        provider = _get_provider_by_name(provider_name, llm_model=llm_model or "")
    else:
        app_cfg = await get_app_settings(db)
        p = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
        m = llm_model or app_cfg.get("llm_model", "")
        provider = get_provider_for_user(user, p, m)
    prompt = build_quick_mixes_prompt(direction, no_tobacco)
    input_data = MixProviderInput(
        params=QUICK_SUGGEST_MINIMAL_PARAMS,
        available_tobaccos=[],
        custom_prompt=prompt,
        direction=direction,
    )
    return provider, input_data


async def generate_instruction_input(
    db: AsyncSession,
    user: User,
    mix: dict,
    params: dict,
    *,
    provider_name: str | None = None,
    llm_model: str | None = None,
) -> tuple[BaseProvider, InstructionProviderInput]:
    """Use provider_name and llm_model from mix when present (from GeneratedMix)."""
    from app.schemas.mix import MixItem

    mix_item = MixItem(
        id=mix.get("id", "mix_1"),
        title=mix.get("title", ""),
        tobaccos=mix.get("tobaccos", []),
        flavor=mix.get("flavor", ""),
    )
    if provider_name is not None:
        provider = _get_provider_by_name(provider_name, llm_model=llm_model or "")
    else:
        app_cfg = await get_app_settings(db)
        p = app_cfg.get("llm_provider", settings.LLM_PROVIDER)
        m = llm_model or app_cfg.get("llm_model", "")
        provider = get_provider_for_user(user, p, m)
    input_data = InstructionProviderInput(mix=mix_item, params=params)
    return provider, input_data
