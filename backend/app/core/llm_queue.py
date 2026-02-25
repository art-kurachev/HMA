"""Очередь вызовов к LLM: только один запрос одновременно (несколько пользователей — по одному в момент)."""
import asyncio
from collections.abc import Coroutine
from typing import TypeVar

T = TypeVar("T")

_llm_semaphore = asyncio.Semaphore(1)


async def run_through_llm_queue(coro: Coroutine[None, None, T]) -> T:
    """Выполнить корутину (вызов LLM), пройдя через общую очередь."""
    async with _llm_semaphore:
        return await coro
