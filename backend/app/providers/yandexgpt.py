import json
import logging
import re

import httpx

from app.config import settings
from app.core.prompt_builder import build_instruction_prompt, build_mixes_prompt
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.providers.mock import MockProvider
from app.schemas.instruction import InstructionResponse, TobaccoItem
from app.schemas.mix import MixItem, SuggestResponse

logger = logging.getLogger(__name__)

COMPLETION_URL = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"

_mock = MockProvider()


class YandexGPTProvider(BaseProvider):
    def __init__(self, model: str | None = None) -> None:
        self._model = model or settings.YANDEXGPT_MODEL

    def _model_uri(self) -> str:
        folder = settings.YANDEXGPT_FOLDER_ID
        return f"gpt://{folder}/{self._model}"

    async def _chat(self, prompt: str) -> str:
        if not settings.YANDEXGPT_API_KEY or not settings.YANDEXGPT_FOLDER_ID:
            raise RuntimeError("YANDEXGPT_API_KEY и YANDEXGPT_FOLDER_ID должны быть заданы в .env")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                COMPLETION_URL,
                headers={
                    "Authorization": f"Api-Key {settings.YANDEXGPT_API_KEY}",
                    "x-folder-id": settings.YANDEXGPT_FOLDER_ID,
                },
                json={
                    "modelUri": self._model_uri(),
                    "completionOptions": {
                        "stream": False,
                        "temperature": 0.6,
                        "maxTokens": 1024,
                    },
                    "messages": [
                        {
                            "role": "system",
                                "text": (
                                "Ты — эксперт по кальянам. "
                                "Строго соблюдай правописание и термины (уголь, калауд, колпак, забивка и т.д.). "
                                "Отвечай ТОЛЬКО валидным JSON без markdown-обёрток."
                            ),
                        },
                        {"role": "user", "text": prompt},
                    ],
                },
                timeout=60,
            )
            resp.raise_for_status()
            body = resp.json()

        alternatives = body.get("result", {}).get("alternatives", [])
        if not alternatives:
            raise RuntimeError("YandexGPT вернул пустой ответ")

        msg = alternatives[0].get("message", {})
        text = msg.get("text", "") or msg.get("content", "")
        if not text:
            raise RuntimeError("YandexGPT вернул пустой текст")
        return text

    @staticmethod
    def _extract_json(raw: str) -> dict:
        text = raw.strip()
        if not text:
            raise ValueError("Пустой ответ модели")

        # Убираем markdown-обёртки ```json ... ``` или ``` ... ```
        if text.startswith("```"):
            lines = text.split("\n", 1)
            first = lines[0]
            prefix_len = len(first)  # ``` или ```json
            text = text[prefix_len:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        # Пытаемся найти JSON-объект в тексте (на случай пояснений до/после)
        if not text.startswith("{"):
            match = re.search(r"\{[\s\S]*\}", text)
            if match:
                text = match.group(0)

        return json.loads(text)

    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        try:
            prompt = build_mixes_prompt(input_data.params, input_data.available_tobaccos)
            raw = await self._chat(prompt)
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
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.warning("YandexGPT mixes parse error, fallback to mock: %s", e)
            return await _mock.generate_mixes(input_data)

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        raw = ""
        try:
            mix_dict = {
                "title": input_data.mix.title,
                "tobaccos": input_data.mix.tobaccos,
            }
            prompt = build_instruction_prompt(mix_dict, input_data.params)
            raw = await self._chat(prompt)
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
        except (json.JSONDecodeError, ValueError, KeyError, RuntimeError) as e:
            logger.warning(
                "YandexGPT instruction error, fallback to mock: %s. Raw: %r",
                e,
                raw[:500] if raw else "(empty)",
            )
            return await _mock.generate_instruction(input_data)
