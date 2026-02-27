import re

from app.providers.base import BaseProvider, InstructionProviderInput, MixProviderInput
from app.schemas.instruction import InstructionResponse
from app.schemas.mix import MixItem, SuggestResponse


def _parse_tobaccos(text: str) -> list[str]:
    text = text.strip()
    items = re.split(r"\n+", text)
    result = []
    for item in items:
        name = item.strip()
        if name and len(name) > 1:
            result.append(name)
    return result[:20] if result else ["Black Nana", "Blue Horse", "Darkside Core"]


# Mock-миксы по цели вечера (быстрый совет с экрана выбора цели).
_MOCK_QUICK_MIXES = {
    "movie": [
        MixItem(
            id="mix_1",
            title="Тихий вечер",
            tobaccos=["Darkside Hola", "MUSTHAVE Pinkman"],
            flavor="Лёгкий фрукт, не отвлекает",
        ),
        MixItem(
            id="mix_2",
            title="Мята и манго",
            tobaccos=["Darkside Core", "Daily Hookah Манго", "Severniy Мята"],
            flavor="Свежий спокойный вкус",
        ),
        MixItem(
            id="mix_3",
            title="Четвёрка под кино",
            tobaccos=["Element Земляника", "Spectrum Ананас", "Bonche Клюква", "Hype Мята"],
            flavor="Привычная сладость, ненавязчиво",
        ),
    ],
    "relax": [
        MixItem(
            id="mix_1",
            title="Крепкий цитрус",
            tobaccos=["Darkside Core", "MUSTHAVE Pinkman", "Black Burn Лимон"],
            flavor="Средняя крепость, необычная кислинка",
        ),
        MixItem(
            id="mix_2",
            title="Дымный ягодный",
            tobaccos=["Satyr Голубика", "Element Земляника", "Bonche Клюква", "Hype Мята"],
            flavor="Крепковато, необычное сочетание",
        ),
        MixItem(
            id="mix_3",
            title="Тёмная вишня",
            tobaccos=["Darkside Вишня", "Trofi'moff Вишня"],
            flavor="Крепкий, насыщенный, расслабляющий",
        ),
    ],
    "surprise": [
        MixItem(
            id="mix_1",
            title="Рандом фрукт",
            tobaccos=["Element Земляника", "Jent Манго"],
            flavor="Неожиданная пара",
        ),
        MixItem(
            id="mix_2",
            title="Тройка-сюрприз",
            tobaccos=["MUSTHAVE Pinkman", "Daily Hookah Манго", "Darkside Core"],
            flavor="Абсолютно любой микс",
        ),
        MixItem(
            id="mix_3",
            title="Микс-сюрприз",
            tobaccos=["Darkside Hola", "Nash Кола", "Deus Клубника", "Severniy Мята"],
            flavor="Любые сочетания на выбор",
        ),
    ],
}


class MockProvider(BaseProvider):
    async def generate_mixes(self, input_data: MixProviderInput) -> SuggestResponse:
        direction = getattr(input_data, "direction", None)
        if direction in _MOCK_QUICK_MIXES:
            return SuggestResponse(mixes=_MOCK_QUICK_MIXES[direction], clarify=[])

        tobaccos = input_data.available_tobaccos or _parse_tobaccos(
            input_data.params.get("available_tobaccos_text", "")
        )
        if not tobaccos:
            tobaccos = ["Black Nana", "Blue Horse", "Darkside Core"]
        default = ["Black Nana", "Blue Horse", "Darkside Core", "Element Земляника"]
        avail = list((tobaccos + default)[:4])
        while len(avail) < 4:
            avail.append(default[len(avail) % len(default)])
        t1, t2, t3, t4 = avail[0], avail[1], avail[2], avail[3]
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
                tobaccos=[t1, t2, t3],
                flavor="Яркие ягоды и свежесть",
            ),
            MixItem(
                id="mix_3",
                title="Микс в четверку",
                tobaccos=[t1, t2, t3, t4],
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

        is_quick = input_data.params.get("_quick_flow", False)

        if is_quick:
            return InstructionResponse(
                tobaccos=tobacco_items,
                packing=[
                    "Порезать, перемешать, забить. Отступ 1 мм.",
                    "Базовый табак вниз, акцентный сверху.",
                ],
                warmup=[
                    "Прогрев 5–8 минут, первые тяги аккуратные.",
                    "Не раскрылся — добавь уголь на 1–2 минуты.",
                ],
                warmup_seconds=480,
                smoking=[
                    "Средняя тяга, паузы 20–30 сек.",
                    "Через 10–15 мин можно чуть усилить жар.",
                ],
                if_not_opened=[
                    "Горчит — снять 1 уголь на пару минут.",
                    "Мало дыма — добавить уголь.",
                ],
            )

        coal_count = input_data.params.get("coal_count_start", 3)
        return InstructionResponse(
            tobaccos=tobacco_items,
            packing=[
                "Порезать, перемешать, забить плотно. Отступ 1 мм.",
                "Центр не трогать.",
            ],
            warmup=[
                f"Старт: {coal_count} угля, прогрев 5–8 минут.",
                "Не раскрылся — добавь уголь на ребро на 1–2 минуты.",
            ],
            warmup_seconds=480,
            smoking=[
                "Средняя тяга, паузы 20–30 сек.",
                "Через 10–15 мин можно усилить жар.",
            ],
            if_not_opened=[
                "Горчит — снять 1 уголь на пару минут.",
                "Мало дыма — добавить уголь.",
            ],
        )
