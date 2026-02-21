from typing import Literal, Optional

from pydantic import BaseModel, Field


class MixParams(BaseModel):
    bowl: Literal["turka", "phunnel", "killer"]
    heat_control: Literal["kaloud", "foil"]
    has_cap: bool
    coal_size: Literal[25, 26]
    coal_count_start: Literal[2, 3, 4]
    strength: Literal["low", "medium", "high"]
    profiles: list[str]
    available_tobaccos_text: str


class MixItem(BaseModel):
    id: str
    title: str
    tobaccos: list[str]
    flavor: str
    mix_db_id: Optional[int] = None


class SuggestRequest(BaseModel):
    telegram_id: int
    params: MixParams


class SuggestResponse(BaseModel):
    mixes: list[MixItem]
    clarify: list[str] = Field(default_factory=list)


class InstructionRequest(BaseModel):
    telegram_id: int
