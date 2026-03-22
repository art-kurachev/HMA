from __future__ import annotations

import ast
import json
import logging
import time
import uuid

import httpx

from app.config import settings
from app.core.prompt_builder import build_instruction_prompt, build_mixes_prompt
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.schemas.instruction import InstructionResponse, TobaccoItem
from app.schemas.mix import MixItem, SuggestResponse

logger = logging.getLogger(__name__)

OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
CHAT_URL = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
TOKEN_TTL = 25 * 60  # обновляем за 5 мин до истечения (токен живёт 30 мин)


class GigaChatProvider(BaseProvider):
    def __init__(self, model: str | None = None) -> None:
        self._access_token: str | None = None
        self._token_expires_at: float = 0
        self._model = model or settings.GIGACHAT_MODEL

    async def _ensure_token(self, client: httpx.AsyncClient) -> str:
        if self._access_token and time.time() < self._token_expires_at:
            return self._access_token

        if not settings.GIGACHAT_AUTH_KEY:
            raise RuntimeError("GIGACHAT_AUTH_KEY не задан в .env")

        resp = await client.post(
            OAUTH_URL,
            headers={
                "Authorization": f"Basic {settings.GIGACHAT_AUTH_KEY}",
                "RqUID": str(uuid.uuid4()),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"scope": settings.GIGACHAT_SCOPE},
            timeout=30,
        )
        resp.raise_for_status()
        body = resp.json()
        self._access_token = body["access_token"]
        self._token_expires_at = time.time() + TOKEN_TTL
        logger.info("GigaChat OAuth token obtained")
        return self._access_token  # type: ignore[return-value]

    def _chat_payload(self, model: str, prompt: str) -> dict:
        return {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ты — эксперт по кальянам. "
                        "Строго соблюдай правописание и термины (уголь, калауд, колпак, забивка и т.д.). "
                        "Отвечай ТОЛЬКО валидным JSON без markdown-обёрток."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.85,
            "max_tokens": 1024,
        }

    async def _chat(self, client: httpx.AsyncClient, prompt: str) -> str:
        token = await self._ensure_token(client)
        # Только три модели: GigaChat-2-Max, GigaChat-2-Pro, GigaChat-2-Lite
        fallbacks = ["GigaChat-2-Pro", "GigaChat-2-Lite", "GigaChat-2-Max"]
        models_to_try = [self._model] + [m for m in fallbacks if m != self._model]

        last_exc = None
        for model in models_to_try:
            try:
                resp = await client.post(
                    CHAT_URL,
                    headers={"Authorization": f"Bearer {token}"},
                    json=self._chat_payload(model, prompt),
                    timeout=30,
                )
                resp.raise_for_status()
                content: str = resp.json()["choices"][0]["message"]["content"]
                if model != self._model:
                    logger.info("GigaChat: модель %s недоступна, использована %s", self._model, model)
                return content
            except httpx.HTTPStatusError as e:
                last_exc = e
                if e.response.status_code == 404:
                    logger.warning("GigaChat: модель %s вернула 404, пробуем другую", model)
                    continue
                raise
        if last_exc:
            raise last_exc
        raise RuntimeError("GigaChat: не удалось выбрать модель")

    @staticmethod
    def _extract_json(raw: str) -> dict:
        """Извлекает JSON из ответа, даже если модель обернула его в ```json...```."""
        text = raw.strip()
        # Убрать markdown-блок
        if text.startswith("```"):
            lines = text.split("\n", 1)
            text = lines[1] if len(lines) > 1 else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        text = text.strip()
        # Вырезать первый JSON-объект по фигурным скобкам
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # GigaChat иногда возвращает одинарные кавычки вместо двойных
            result = ast.literal_eval(text)
            if isinstance(result, dict):
                return result
            raise

    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        prompt = input_data.custom_prompt or build_mixes_prompt(input_data.params, input_data.available_tobaccos)

        async with httpx.AsyncClient(verify=False, timeout=60) as client:
            raw = await self._chat(client, prompt)

        data = self._extract_json(raw)
        mixes = []
        for m in data.get("mixes", []):
            mixes.append(
                MixItem(
                    id=m.get("id", f"mix_{len(mixes) + 1}"),
                    title=m.get("title", "Микс"),
                    tobaccos=m.get("tobaccos", []),
                    flavor=m.get("flavor", ""),
                )
            )

        limit = 10 if input_data.params.get("_shopping_list") else 3
        return SuggestResponse(
            mixes=mixes[:limit],
            clarify=data.get("clarify", []),
        )

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        mix_dict = {
            "title": input_data.mix.title,
            "tobaccos": input_data.mix.tobaccos,
        }
        prompt = build_instruction_prompt(mix_dict, input_data.params)

        async with httpx.AsyncClient(verify=False, timeout=60) as client:
            raw = await self._chat(client, prompt)

        data = self._extract_json(raw)
        tobaccos = [TobaccoItem(name=t["name"], percent=t["percent"]) for t in data.get("tobaccos", [])]

        return InstructionResponse(
            tobaccos=tobaccos,
            packing=data.get("packing", []),
            warmup=data.get("warmup", []),
            warmup_seconds=data.get("warmup_seconds", 360),
            smoking=data.get("smoking", []),
            if_not_opened=data.get("if_not_opened", []),
        )
