import re
from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import MixItem, SuggestResponse


def _parse_tobaccos(text: str) -> list[str]:
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
                tobaccos=[t1, t2],
                flavor="Сладкий фрукт с лёгкой кислинкой",
            ),
            MixItem(
                id="mix_2",
                title="Ягодный взрыв",
                tobaccos=[t2, t3],
                flavor="Яркие ягоды и свежесть",
            ),
            MixItem(
                id="mix_3",
                title="Микс в тройку",
                tobaccos=[t1, t2, t3],
                flavor="Многослойный и насыщенный вкус",
            ),
        ]
        return SuggestResponse(mixes=mixes, clarify=[])

    async def generate_instruction(self, input_data: InstructionProviderInput) -> InstructionResponse:
        from app.schemas.instruction import TobaccoItem

        tobaccos = input_data.mix.tobaccos or ["Black Nana", "Blue Horse"]
        total = len(tobaccos)
        tobacco_items = []
        remaining = 100
        for i, name in enumerate(tobaccos):
            pct = remaining // (total - i)
            tobacco_items.append(TobaccoItem(name=name, percent=pct))
            remaining -= pct

        coal_count = input_data.params.get("coal_count_start", 3)
        heat = input_data.params.get("heat_control", "kaloud")

        return InstructionResponse(
            tobaccos=tobacco_items,
            packing=[
                "Табак мелко порезать",
                "Тщательно перемешать",
                "Забивка плотная",
                "1 мм отступ",
                "Контакт допустим, но не «в кашу»",
            ],
            warmup=[
                f"Старт: {coal_count} угля",
                "Прогрев: 5–6 минут",
                "Первые тяги аккуратные",
            ],
            warmup_seconds=360,
            smoking=[
                "Тяга средняя, спокойная",
                "Паузы 20–30 секунд",
                "После 10–15 минут можно чуть усилить жар (сдвинуть угли к центру)",
            ],
            if_not_opened=[
                "3-й уголь на ребро на 60–90 сек",
                "Затем убрать",
            ],
        )
