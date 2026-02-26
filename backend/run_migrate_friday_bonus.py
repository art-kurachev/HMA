#!/usr/bin/env python3
"""One-off: add friday_bonus column to users. Run: cd backend && uv run python run_migrate_friday_bonus.py"""
import asyncio

from sqlalchemy import text

from app.db.session import engine


async def main() -> None:
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE users ADD COLUMN friday_bonus INTEGER DEFAULT 0"))
        print("Done: friday_bonus column added")
    except Exception as e:
        msg = str(e).lower()
        if "already exists" in msg or "duplicate" in msg:
            print("Done: friday_bonus column already exists")
        else:
            raise


if __name__ == "__main__":
    asyncio.run(main())
