from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import JSON


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    telegram_first_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    telegram_last_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    telegram_username: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_group: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    welcome_requests_used: Mapped[int] = mapped_column(Integer, default=0)  # 0–3
    last_weekly_refill: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    friday_bonus: Mapped[int] = mapped_column(Integer, default=0)  # +1 по пятницам 19:00, если остаток ≤3
    paid_generations: Mapped[int] = mapped_column(Integer, default=0)  # куплено за Stars
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    usage_date: Mapped[date] = mapped_column("date", Date, primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_daily_usage_user_date"),)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    params: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class GeneratedMix(Base):
    __tablename__ = "generated_mixes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    mix_json: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    llm_model_used: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mix_id: Mapped[int] = mapped_column(Integer, ForeignKey("generated_mixes.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    telegram_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    generations: Mapped[int] = mapped_column(Integer, nullable=False)
    stars_paid: Mapped[int] = mapped_column(Integer, nullable=False)
    telegram_charge_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class AppSetting(Base):
    __tablename__ = "app_settings"

    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)


class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    mixes: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False)
    checked_tobaccos: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), "sqlite"), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
