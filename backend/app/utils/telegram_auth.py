"""
Telegram WebApp initData validator.
Stub implementation - always returns True for MVP.
Real implementation should verify hash using bot token.
"""
from typing import Optional


def validate_init_data(init_data: str, bot_token: Optional[str] = None) -> bool:
    """Validate Telegram WebApp initData. Stub: always True."""
    return True
