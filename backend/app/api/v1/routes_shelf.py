"""Распознавание табаков на полке по фото (GigaChat vision)."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.provider_router import ensure_user_and_provider_group
from app.core.quota import check_and_consume_quota
from app.db.session import get_db
from app.providers.gigachat import GigaChatProvider
from app.schemas.shelf import ShelfRecognizeResponse
from app.utils.telegram_auth import resolve_telegram_id

router = APIRouter(prefix="/shelf", tags=["shelf"])

_ALLOWED_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
_MAX_BYTES = 10 * 1024 * 1024


@router.post("/recognize-photo", response_model=ShelfRecognizeResponse)
async def recognize_shelf_photo(
    telegram_id: int = Form(..., description="Telegram user ID"),
    image: UploadFile = File(..., description="Фото полки (JPEG / PNG / WebP)"),
    x_telegram_init_data: Optional[str] = Header(None, alias="X-Telegram-Init-Data"),
    db: AsyncSession = Depends(get_db),
):
    """Загружает фото в GigaChat, возвращает JSON с распознанными названиями табаков."""
    uid = resolve_telegram_id(x_telegram_init_data, telegram_id, settings.BOT_TOKEN)
    user = await ensure_user_and_provider_group(db, uid, init_data=x_telegram_init_data)

    allowed, _provider_name, model_name = await check_and_consume_quota(db, user)
    if not allowed:
        raise HTTPException(status_code=429, detail="quota_exceeded")

    if not settings.GIGACHAT_AUTH_KEY:
        raise HTTPException(status_code=503, detail="GigaChat не настроен (GIGACHAT_AUTH_KEY)")

    content_type = (image.content_type or "").split(";")[0].strip().lower()
    if content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Нужно изображение: JPEG, PNG или WebP",
        )

    raw = await image.read()
    if len(raw) > _MAX_BYTES:
        raise HTTPException(status_code=400, detail="Файл больше 10 МБ")

    if content_type == "image/png":
        filename = "shelf.png"
    elif content_type == "image/webp":
        filename = "shelf.webp"
    else:
        filename = "shelf.jpg"

    provider = GigaChatProvider(model=model_name or None)
    try:
        # Не через общую LLM-очередь: иначе «Распознаю» висит, пока кто-то жмёт подбор миксов.
        tobaccos = await provider.recognize_tobaccos_from_photo(raw, filename, content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e

    return ShelfRecognizeResponse(tobaccos=tobaccos)
