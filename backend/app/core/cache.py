"""
Simple in-memory cache for MVP.
TODO: replace with Redis for production.
"""
from typing import Any, Optional

_cache: dict = {}


def get(key: str) -> Optional[Any]:
    return _cache.get(key)


def set_(key: str, value: Any) -> None:
    _cache[key] = value


def delete(key: str) -> None:
    _cache.pop(key, None)
