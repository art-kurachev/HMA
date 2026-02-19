import re
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import MixCompositionItem, MixItem, SuggestResponse


def _parse_tobaccos(text: str) -> list[str]:
    """Extract tobacco names from available_tobaccos_text."""
    text = text.strip()
    items = re.split(r"[,;/\n]+", text)
    result = []
    for item in items:
        name = item.strip()
        if name and len(name) > 1:
            result.append(name)
    return result[:20] if result else ["Black Nana", "Blue Horse", "Darkside Core"]


class MockProvider(BaseProvider):
    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        tobaccos = input_data.available_tobaccos or _parse_tobaccos(
            input_data.params.get("available_tobaccos_text", "")
        )
        if not tobaccos:
            tobaccos = ["Black Nana", "Blue Horse", "Darkside Core"]
        default = ["Black Nana", "Blue Horse", "Darkside Core"]
        t1, t2, t3 = (tobaccos + default)[:3]
        mixes = [
            MixItem(
                id="mix_1",
                title="Классика фрукт",
                composition=[
                    MixCompositionItem(name=t1, percent=60),
                    MixCompositionItem(name=t2, percent=40),
                ],
                why=["Сбалансированный вкус", "Подходит для новичков"],
            ),
            MixItem(
                id="mix_2",
                title="Ягодный взрыв",
                composition=[
                    MixCompositionItem(name=t2, percent=50),
                    MixCompositionItem(name=t3, percent=50),
                ],
                why=["Яркие ягодные ноты", "Хорошо тянется"],
            ),
            MixItem(
                id="mix_3",
                title="Микс в тройку",
                composition=[
                    MixCompositionItem(name=t1, percent=40),
                    MixCompositionItem(name=t2, percent=30),
                    MixCompositionItem(name=t3, percent=30),
                ],
                why=["Многослойный вкус", "Долгий сеанс"],
            ),
        ]
        return SuggestResponse(mixes=mixes, clarify=[])

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        bowl = input_data.params.get("bowl", "phunnel")
        heat = input_data.params.get("heat_control", "kaloud")
        return InstructionResponse(
            headline="Быстрая инструкция на 20–30 сек",
            bowl=[
                f"Засыпь микс в {bowl} чашу",
                "Не утрамбовывай плотно, оставь воздух",
            ],
            heat=[
                f"Используй {heat}, 2–3 угля 25мм",
                "Прогрей 5 мин, потом можно курить",
            ],
            if_not_opened=[
                "Разомни табак перед засыпкой",
                "Смешай в миске до однородности",
            ],
            smoke=[
                "Медленные, плавные затяжки",
                "Не перегревай — вкус станет горьким",
            ],
            tuning=[
                "Слабый дым — добавь уголь",
                "Горчит — убери уголь или сдвинь в сторону",
            ],
        )
