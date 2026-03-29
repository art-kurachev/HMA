from pydantic import BaseModel, Field


class ShelfRecognizeResponse(BaseModel):
    tobaccos: list[str] = Field(default_factory=list)
