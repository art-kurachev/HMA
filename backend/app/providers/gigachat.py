import json
import logging
import time
import uuid
from typing import Optional

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
    def __init__(self, model: Optional[str] = None) -> None:
        self._access_token: Optional[str] = None
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
        )
        resp.raise_for_status()
        body = resp.json()
        self._access_token = body["access_token"]
        self._token_expires_at = time.time() + TOKEN_TTL
        logger.info("GigaChat OAuth token obtained")
        return self._access_token  # type: ignore[return-value]

    async def _chat(self, client: httpx.AsyncClient, prompt: str) -> str:
        token = await self._ensure_token(client)
        resp = await client.post(
            CHAT_URL,
            headers={"Authorization": f"Bearer {token}"},
            json={
                "model": self._model,
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
                "temperature": 0.7,
                "max_tokens": 1024,
            },
            timeout=30,
        )
        resp.raise_for_status()
        content: str = resp.json()["choices"][0]["message"]["content"]
        return content

    @staticmethod
    def _extract_json(raw: str) -> dict:
        """Извлекает JSON из ответа, даже если модель обернула его в ```json...```."""
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n", 1)
            text = lines[1] if len(lines) > 1 else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        return json.loads(text.strip())

    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        prompt = build_mixes_prompt(input_data.params, input_data.available_tobaccos)

        async with httpx.AsyncClient(verify=False) as client:
            raw = await self._chat(client, prompt)

        data = self._extract_json(raw)
        mixes = []
        for m in data.get("mixes", []):
            mixes.append(
                MixItem(
                    id=m.get("id", f"mix_{len(mixes)+1}"),
                    title=m.get("title", "Микс"),
                    tobaccos=m.get("tobaccos", []),
                    flavor=m.get("flavor", ""),
                )
            )

        return SuggestResponse(
            mixes=mixes[:3],
            clarify=data.get("clarify", []),
        )

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        mix_dict = {
            "title": input_data.mix.title,
            "tobaccos": input_data.mix.tobaccos,
        }
        prompt = build_instruction_prompt(mix_dict, input_data.params)

        async with httpx.AsyncClient(verify=False) as client:
            raw = await self._chat(client, prompt)

        data = self._extract_json(raw)
        tobaccos = [
            TobaccoItem(name=t["name"], percent=t["percent"])
            for t in data.get("tobaccos", [])
        ]

        return InstructionResponse(
            tobaccos=tobaccos,
            packing=data.get("packing", []),
            warmup=data.get("warmup", []),
            warmup_seconds=data.get("warmup_seconds", 360),
            smoking=data.get("smoking", []),
            if_not_opened=data.get("if_not_opened", []),
        )
