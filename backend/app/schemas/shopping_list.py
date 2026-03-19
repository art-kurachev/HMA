from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ShoppingMixItem(BaseModel):
    id: str
    title: str
    tobaccos: list[str]
    flavor: str


class ShoppingListResponse(BaseModel):
    mixes: list[ShoppingMixItem]
    checked_tobaccos: list[str]
    updated_at: Optional[datetime] = None


class GenerateShoppingListRequest(BaseModel):
    telegram_id: int


class UpdateCheckedRequest(BaseModel):
    telegram_id: int
    checked_tobaccos: list[str]
