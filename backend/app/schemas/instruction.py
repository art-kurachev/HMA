from pydantic import BaseModel


class InstructionResponse(BaseModel):
    headline: str
    bowl: list[str]
    heat: list[str]
    if_not_opened: list[str]
    smoke: list[str]
    tuning: list[str]
