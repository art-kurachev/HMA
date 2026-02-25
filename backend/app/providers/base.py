from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from app.schemas.instruction import InstructionResponse
from app.schemas.mix import MixItem, SuggestResponse


class MixProviderInput:
    def __init__(
        self,
        params: dict,
        available_tobaccos: list[str],
        *,
        custom_prompt: Optional[str] = None,
        direction: Optional[str] = None,
    ):
        self.params = params
        self.available_tobaccos = available_tobaccos
        self.custom_prompt = custom_prompt
        self.direction = direction  # для быстрого совета: "movie" | "relax" | "surprise"


class InstructionProviderInput:
    def __init__(self, mix: MixItem, params: dict):
        self.mix = mix
        self.params = params


class BaseProvider(ABC):
    @abstractmethod
    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        pass

    @abstractmethod
    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        pass
