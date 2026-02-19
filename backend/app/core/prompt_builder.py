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
Верни JSON по контракту.
"""


def build_instruction_prompt(mix: dict, params: dict) -> str:
    return f"""
Микс: {mix.get('title', '')}, состав: {mix.get('composition', [])}.
Чаша: {params.get('bowl')}, жар: {params.get('heat_control')}.
Напиши короткую инструкцию 20-30 сек чтения.
"""
