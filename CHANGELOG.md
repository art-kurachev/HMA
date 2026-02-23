# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/)

## [0.3.0] — 2026-02-20

### Изменено
- Упрощён формат миксов: `tobaccos` + `flavor` вместо `composition` + `why`
- Новый экран инструкции: табаки с %, забивка, прогрев, курение, «если не раскрылся»
- Таймер прогрева с паузой и сбросом
- Bottom sheet «Как спасти кальян» (появляется после таймера)
- Убран `tip` из инструкции

### Добавлено
- Иконки: WrenchIcon, PlayIcon, PauseIcon, RestartIcon, CheckIcon, CloseIcon
- Поле `warmup_seconds` в InstructionResponse
- Промпт для LLM с JSON-схемой ответа

## [0.2.0] — 2026-02-19

### Добавлено
- UI из Figma: шрифт Geologica, frosted glass, оранжевый акцент
- Экраны: WelcomeScreen, DirectionScreen, SetupScreen, MixesStep, InstructionStep, FeedbackStep
- Компоненты: ScreenLayout, BottomNav, Icons
- Фон приложения

## [0.1.0] — 2026-02-18

### Добавлено
- FastAPI backend с provider-архитектурой (mock, gigachat, yandexgpt)
- React frontend (Telegram Mini App)
- SQLAlchemy async (SQLite / PostgreSQL)
- A/B testing инфраструктура
- Rate limiting (per user, per day)
- Docker Compose (Postgres, pgAdmin)
