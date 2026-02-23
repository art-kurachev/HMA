"""
Prompt builder for LLM providers.
"""

SPELLING_RULES = """
ОРФОГРАФИЯ И ТЕРМИНЫ (обязательно соблюдать):
- уголь, угли — для нагрева (НЕ «угол»)
- Kaloud, Калауд — бренд колпака (НЕ «калюд», «калод»)
- забивка, табак, чаша, фанел, киллер, турка — термины кальяна
- «сдвинуть угли к краю», «добавить уголь» — правильно
Проверяй правописание: пользователь не должен путаться из-за опечаток."""


def build_mixes_prompt(params: dict, available_tobaccos: list[str]) -> str:
    has_tobaccos = bool(available_tobaccos and available_tobaccos != ["Black Nana", "Blue Horse", "Darkside Core"])

    tobacco_block = ""
    if has_tobaccos:
        tobacco_block = f"""
У пользователя есть эти табаки: {available_tobaccos}.
СТРОГОЕ ПРАВИЛО: используй ТОЛЬКО табаки из этого списка. Не придумывай и не подставляй другие названия.
Названия табаков в ответе должны ТОЧНО совпадать с названиями из списка — без изменений, без сокращений."""
    else:
        tobacco_block = """
У пользователя нет своих табаков. Предложи миксы из реальных, существующих табаков.
Используй ТОЛЬКО табаки от этих производителей: Darkside, MUSTHAVE, Spectrum, Daily Hookah, Element, Satyr, Sebero, Black Burn, Bonche, Hype, Severniy, Jent, Deus, Nash, Trofimoff's.
Указывай полное название: «Бренд Вкус» (например: «Darkside Hola», «MUSTHAVE Pinkman», «Element Земляника»).
НЕ ИСПОЛЬЗУЙ табаки других брендов. НЕ ВЫДУМЫВАЙ несуществующие вкусы."""

    strength_map = {"low": "лёгкий", "medium": "средний", "high": "крепкий"}
    strength = strength_map.get(params.get("strength", "medium"), "средний")

    profiles = params.get("profiles", [])
    profiles_text = ", ".join(profiles) if profiles else "любой"

    return f"""Ты — профессиональный кальянщик с 10-летним опытом. Сгенерируй ровно 3 микса для кальяна.
{SPELLING_RULES}

Параметры сетапа:
- Чаша: {params.get('bowl', 'phunnel')}
- Управление жаром: {params.get('heat_control', 'kaloud')}
- Крепость: {strength}
- Вкусовые предпочтения: {profiles_text}
{tobacco_block}

Каждый микс должен содержать 2–4 табака. Миксы должны отличаться друг от друга.
Название микса — креативное, короткое (2–3 слова).
Описание вкуса — ровно 4–6 слов, без общих фраз.

Верни ТОЛЬКО валидный JSON, без комментариев и markdown:
{{
  "mixes": [
    {{
      "id": "mix_1",
      "title": "Название микса",
      "tobaccos": ["Бренд Вкус 1", "Бренд Вкус 2"],
      "flavor": "Описание вкуса 4-6 слов"
    }},
    {{
      "id": "mix_2",
      "title": "Название микса",
      "tobaccos": ["Бренд Вкус 1", "Бренд Вкус 2"],
      "flavor": "Описание вкуса 4-6 слов"
    }},
    {{
      "id": "mix_3",
      "title": "Название микса",
      "tobaccos": ["Бренд Вкус 1", "Бренд Вкус 2"],
      "flavor": "Описание вкуса 4-6 слов"
    }}
  ],
  "clarify": []
}}"""


def build_instruction_prompt(mix: dict, params: dict) -> str:
    coal_count = params.get("coal_count_start", 3)
    coal_size = params.get("coal_size", 25)
    has_cap = params.get("has_cap", True)

    cap_note = (
        "Колпак есть (Kaloud/Lotus) — учти в инструкции: равномерный прогрев, можно регулировать зазоры, прогрев дольше."
        if has_cap
        else "Колпака нет (фольга) — учти: жар идёт сверху, прогрев быстрее."
    )

    return f"""Ты — профессиональный кальянщик. Составь подробную инструкцию для микса.
{SPELLING_RULES}

Микс: {mix.get('title', '')}
Табаки: {mix.get('tobaccos', [])}
Чаша: {params.get('bowl', 'phunnel')}
Управление жаром: {params.get('heat_control', 'kaloud')}
{cap_note}
Угли: {coal_count} шт, размер {coal_size}мм

Правила:
- Каждый пункт в packing, warmup, smoking, if_not_opened — 1–2 коротких предложения, только суть, без воды.
- Названия табаков в поле "tobaccos" должны ТОЧНО совпадать с переданными выше.
- Проценты должны в сумме давать 100.
- Шаги забивки — конкретные, практичные, 3–5 пунктов.
- Прогрев — с учётом наличия колпака и типа чаши. Время прогрева — около 8 минут.
- warmup_seconds — 480 (8 минут прогрева).
- Курение — как тянуть, паузы, когда усилить/ослабить жар.
- Если не раскрылся — конкретные действия (добавить уголь, сдвинуть, подождать).

Верни ТОЛЬКО валидный JSON, без комментариев и markdown:
{{
  "tobaccos": [
    {{"name": "Точное название табака", "percent": 45}}
  ],
  "packing": ["шаг 1", "шаг 2", "шаг 3"],
  "warmup": ["старт: {coal_count} угля", "прогрев: ~8 минут", "первые тяги аккуратные"],
  "warmup_seconds": 480,
  "smoking": ["тип тяги", "паузы", "управление жаром"],
  "if_not_opened": ["действие 1", "действие 2"]
}}"""
