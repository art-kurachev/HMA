"""
GigaChat provider stub.
TODO: integrate real GigaChat API.
"""

from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.providers.mock import MockProvider
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import SuggestResponse

_mock = MockProvider()


class GigaChatProvider(BaseProvider):
    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        return await _mock.generate_mixes(input_data)

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        return await _mock.generate_instruction(input_data)
