"""
Prompt builder for LLM providers.
Used by gigachat/yandexgpt when integrated.
"""


def build_mixes_prompt(params: dict, available_tobaccos: list[str]) -> str:
    return f"""
Сгенерируй ровно 3 микса для кальяна.
Чаша: {params.get('bowl', 'phunnel')}, управление жаром: {params.get('heat_control', 'foil')}.
Крепость: {params.get('strength', 'medium')}.
Профили: {params.get('profiles', [])}.
Доступные табаки (использовать ТОЛЬКО из списка): {available_tobaccos}.

Верни JSON строго в формате:
{{
  "mixes": [
    {{
      "id": "mix_1",
      "title": "Название микса",
      "tobaccos": ["Табак 1", "Табак 2"],
      "flavor": "Краткое описание вкуса 4-6 слов"
    }}
  ],
  "clarify": []
}}
"""


def build_instruction_prompt(mix: dict, params: dict) -> str:
    return f"""
Микс: {mix.get('title', '')}, табаки: {mix.get('tobaccos', [])}.
Чаша: {params.get('bowl')}, жар: {params.get('heat_control')}.
Напиши короткую инструкцию 20-30 сек чтения.
"""
