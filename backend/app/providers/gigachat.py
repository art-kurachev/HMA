from __future__ import annotations

import ast
import json
import logging
import re
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
FILES_URL = "https://gigachat.devices.sberbank.ru/api/v1/files"
TOKEN_TTL = 25 * 60  # обновляем за 5 мин до истечения (токен живёт 30 мин)

# Только Pro (и Lite как запасной при 404), без Max — по требованию продукта.
SHELF_VISION_MODELS = ["GigaChat-2-Pro", "GigaChat-2-Lite"]

# Не вставлять сюда примеры реальных брендов — модель их копирует даже без фото.

SHELF_PHOTO_PROMPT = """Режим: только переписывание читаемого текста с этикеток на фото (как OCR). Ты НЕ угадываешь и НЕ дополняешь названия из памяти.

На снимке — упаковки табака для кальяна. Каждая отдельная упаковка с читаемым текстом = максимум одна строка в массиве.

ЗАПРЕЩЕНО:
- подставлять «типичные» или популярные бренды, если такого текста нет на фото;
- дописывать слово целиком по одной-две буквы с этикетки;
- переводить, исправлять орфографию «как в каталоге»;
- смешивать две разные упаковки в одну строку.

РАЗРЕШЕНО:
- копировать то, что реально читается (кириллица или латиница — как на упаковке);
- если виден только обрывок — записать только его, без додумывания;
- пропустить упаковку, если текст нечитаем;
- вернуть пустой список, если ничего нельзя уверенно прочитать.

Ответ — один JSON, без markdown и без текста вокруг:
{"tobaccos":["..."]}"""


def _shelf_verify_prompt(candidates: list[str]) -> str:
    lines_json = json.dumps(candidates, ensure_ascii=False)
    return f"""Это ТО ЖЕ фото упаковок табака.

Ранее был составлен список строк (внутри могут быть ВЫДУМАННЫЕ позиции, не совпадающие с фото):
{lines_json}

Задача: вернуть JSON {{"tobaccos":[...]}} — только ПОДМНОЖЕСТВО этого списка.

Включай строку из списка ТОЛЬКО если на фото ты видишь упаковку, на которой есть этот текст или очень близкий фрагмент (те же слова).
Если строка из списка не соответствует ни одной видимой этикетке — НЕ включай её.
Не добавляй новых строк, не переименовывай и не объединяй — только убери лишнее из списка кандидатов.

Если ни одна строка не подтверждается фото — верни {{"tobaccos":[]}}.

Один JSON без markdown."""


SHELF_SYSTEM_OCR = (
    "Ты работаешь как OCR по фото упаковок табака. "
    "Не используешь общие знания о брендах и не дополняешь названия. "
    "Только копируешь видимый текст. Ответ — только валидный JSON."
)

SHELF_SYSTEM_VERIFY = (
    "Ты проверяешь список строк по тому же фото. "
    "Удаляешь строки, которых нет на видимых этикетках. "
    "Не добавляешь новых названий. Ответ — только валидный JSON."
)


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

    async def _upload_image_to_storage(
        self,
        client: httpx.AsyncClient,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> str:
        token = await self._ensure_token(client)
        resp = await client.post(
            FILES_URL,
            headers={"Authorization": f"Bearer {token}"},
            files={"file": (filename, image_bytes, content_type)},
            data={"purpose": "general"},
            timeout=120.0,
        )
        resp.raise_for_status()
        body = resp.json()
        return str(body["id"])

    async def _delete_storage_file(self, client: httpx.AsyncClient, file_id: str) -> None:
        token = await self._ensure_token(client)
        try:
            resp = await client.post(
                f"{FILES_URL}/{file_id}/delete",
                headers={"Authorization": f"Bearer {token}"},
                timeout=30.0,
            )
            if resp.is_success:
                return
        except Exception:
            logger.debug("GigaChat: не удалось удалить файл %s из хранилища", file_id)

    def _chat_payload_with_image_attachment(
        self,
        model: str,
        file_id: str,
        user_text: str,
        *,
        temperature: float = 0.25,
        max_tokens: int = 768,
        top_p: float | None = None,
        system_content: str | None = None,
    ) -> dict:
        sys = system_content or (
            "Ты читаешь названия с фото упаковок табака для кальяна. "
            "Точно переписываешь видимый текст с этикеток. "
            "Не придумываешь бренды и вкусы. "
            "Ответ только валидным JSON без markdown."
        )
        payload: dict = {
            "model": model,
            "messages": [
                {"role": "system", "content": sys},
                {
                    "role": "user",
                    "content": user_text,
                    "attachments": [file_id],
                },
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if top_p is not None:
            payload["top_p"] = top_p
        return payload

    async def _chat_with_image(
        self,
        client: httpx.AsyncClient,
        file_id: str,
        user_text: str,
        *,
        models_order: list[str] | None = None,
        temperature: float = 0.25,
        max_tokens: int = 768,
        top_p: float | None = None,
        system_content: str | None = None,
    ) -> str:
        token = await self._ensure_token(client)
        fallbacks = ["GigaChat-2-Pro", "GigaChat-2-Max", "GigaChat-2-Lite"]
        if models_order:
            models_to_try = list(models_order)
        else:
            models_to_try = [self._model] + [m for m in fallbacks if m != self._model]
        last_exc = None
        for model in models_to_try:
            try:
                resp = await client.post(
                    CHAT_URL,
                    headers={"Authorization": f"Bearer {token}"},
                    json=self._chat_payload_with_image_attachment(
                        model,
                        file_id,
                        user_text,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        top_p=top_p,
                        system_content=system_content,
                    ),
                    timeout=120.0,
                )
                resp.raise_for_status()
                content: str = resp.json()["choices"][0]["message"]["content"]
                if models_order and model != models_order[0]:
                    logger.info("GigaChat vision shelf: использована модель %s", model)
                elif not models_order and model != self._model:
                    logger.info(
                        "GigaChat vision: модель %s недоступна, использована %s",
                        self._model,
                        model,
                    )
                return content
            except httpx.HTTPStatusError as e:
                last_exc = e
                if e.response.status_code == 404:
                    logger.warning("GigaChat vision: модель %s вернула 404, пробуем другую", model)
                    continue
                raise
        if last_exc:
            raise last_exc
        raise RuntimeError("GigaChat: не удалось выбрать модель для vision")

    async def recognize_tobaccos_from_photo(
        self,
        image_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> list[str]:
        """Загружает изображение в хранилище GigaChat, распознаёт табаки, удаляет файл."""
        async with httpx.AsyncClient(verify=False, timeout=120) as client:
            file_id = await self._upload_image_to_storage(client, image_bytes, filename, content_type)
            try:
                raw = await self._chat_with_image(
                    client,
                    file_id,
                    SHELF_PHOTO_PROMPT,
                    models_order=SHELF_VISION_MODELS,
                    temperature=0.02,
                    max_tokens=1200,
                    top_p=0.25,
                    system_content=SHELF_SYSTEM_OCR,
                )
                candidates = self._normalize_shelf_strings(self._extract_shelf_response(raw).get("tobaccos", []))
                if not candidates:
                    return []

                raw2 = await self._chat_with_image(
                    client,
                    file_id,
                    _shelf_verify_prompt(candidates),
                    models_order=SHELF_VISION_MODELS,
                    temperature=0.05,
                    max_tokens=900,
                    top_p=0.2,
                    system_content=SHELF_SYSTEM_VERIFY,
                )
                filtered = self._normalize_shelf_strings(self._extract_shelf_response(raw2).get("tobaccos", []))
                return self._keep_only_candidate_subset(candidates, filtered)
            finally:
                await self._delete_storage_file(client, file_id)

    @staticmethod
    def _normalize_shelf_strings(items: object) -> list[str]:
        if not isinstance(items, list):
            return []
        seen_lower: set[str] = set()
        out: list[str] = []
        for x in items:
            s = str(x).strip()
            s = re.sub(r"\s+", " ", s)
            if not s:
                continue
            key = s.lower()
            if key in seen_lower:
                continue
            seen_lower.add(key)
            out.append(s)
            if len(out) >= 50:
                break
        return out

    @staticmethod
    def _keep_only_candidate_subset(candidates: list[str], verified: list[str]) -> list[str]:
        """Оставляем только строки из candidates, которые модель подтвердила во втором проходе (без новых выдумок)."""
        if not verified:
            return []
        allowed = {c.lower(): c for c in candidates}
        seen: set[str] = set()
        out: list[str] = []
        for v in verified:
            t = re.sub(r"\s+", " ", str(v).strip())
            if not t:
                continue
            k = t.lower()
            if k not in allowed:
                continue
            if k in seen:
                continue
            seen.add(k)
            out.append(allowed[k])
        return out

    @staticmethod
    def _extract_shelf_response(raw: str) -> dict:
        """JSON с ключом tobaccos или голый массив строк."""
        try:
            data = GigaChatProvider._extract_json(raw)
            if isinstance(data.get("tobaccos"), list):
                return data
        except (json.JSONDecodeError, SyntaxError, TypeError, ValueError):
            pass
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n", 1)
            text = lines[1] if len(lines) > 1 else text[3:]
            if text.endswith("```"):
                text = text[:-3]
        text = text.strip()
        start = text.find("[")
        end = text.rfind("]")
        if start != -1 and end > start and end > start:
            fragment = text[start : end + 1]
            try:
                parsed = json.loads(fragment)
                if isinstance(parsed, list):
                    return {"tobaccos": parsed}
            except json.JSONDecodeError:
                try:
                    parsed = ast.literal_eval(fragment)
                    if isinstance(parsed, list):
                        return {"tobaccos": parsed}
                except (SyntaxError, ValueError):
                    pass
        logger.warning("GigaChat shelf: не удалось разобрать ответ: %s", raw[:400])
        return {"tobaccos": []}

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
