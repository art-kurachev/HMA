"""Telegram WebApp initData validator and user extraction."""

import hashlib
import hmac
import json
from typing import Optional
from urllib.parse import parse_qs


def validate_init_data(init_data: str, bot_token: Optional[str]) -> bool:
    """Validate Telegram WebApp initData via HMAC-SHA256. Returns False if no token or invalid."""
    if not init_data or not bot_token:
        return False
    try:
        parsed = parse_qs(init_data, keep_blank_values=True)
        params = {k: (v[0] if v else "") for k, v in parsed.items()}
        hash_val = params.pop("hash", None)
        if not hash_val:
            return False
        data_check = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
        secret_key = hmac.new(bot_token.encode(), b"WebAppData", hashlib.sha256).digest()
        computed = hmac.new(secret_key, data_check.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(computed, hash_val)
    except Exception:
        return False


def extract_user_id_from_init_data(init_data: str) -> Optional[int]:
    """Extract user.id from initData (call only after validate_init_data)."""
    if not init_data:
        return None
    try:
        parsed = parse_qs(init_data, keep_blank_values=True)
        user_str = (parsed.get("user") or [None])[0]
        if not user_str:
            return None
        user = json.loads(user_str)
        uid = user.get("id")
        return int(uid) if isinstance(uid, (int, float)) else None
    except Exception:
        return None


def resolve_telegram_id(init_data: Optional[str], fallback: int, bot_token: Optional[str]) -> int:
    """Используем initData только когда fallback=123456789 (Main button, getTelegramId не сработал).
    Иначе — fallback (Menu button, getTelegramId дал реальный ID)."""
    if fallback != 123456789:
        return fallback  # Menu button: уже есть реальный telegram_id
    if init_data and bot_token and validate_init_data(init_data, bot_token):
        uid = extract_user_id_from_init_data(init_data)
        if uid is not None:
            return uid
    return fallback
