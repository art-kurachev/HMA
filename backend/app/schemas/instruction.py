from pydantic import BaseModel


class TobaccoItem(BaseModel):
    name: str
    percent: int


class InstructionResponse(BaseModel):
    tobaccos: list[TobaccoItem]
    packing: list[str]
    warmup: list[str]
    warmup_seconds: int
    if_not_opened: list[str]
    tip: str
    smoking: list[str]
