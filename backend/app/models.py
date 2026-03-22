from __future__ import annotations

from datetime import date, datetime, timezone
from typing import List

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utc_now() -> datetime:
    """SQLAlchemy `default=` callables are invoked on each INSERT (unlike `default=func()` at define time)."""
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utc_now)

    profile: Mapped[UserProfile] = relationship(
        "UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    weight_entries: Mapped[List[WeightEntry]] = relationship(
        "WeightEntry", back_populates="user", cascade="all, delete-orphan", order_by="WeightEntry.entry_date"
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # Avoid Mapped[Optional[T]] — SQLAlchemy 2.0 + Python 3.14 has union typing issues.
    target_weight_kg = mapped_column(Float, nullable=True)
    height_cm = mapped_column(Float, nullable=True)
    age = mapped_column(Integer, nullable=True)
    gender = mapped_column(String(16), nullable=True)
    exercise_level = mapped_column(String(32), nullable=True)

    user: Mapped[User] = relationship("User", back_populates="profile")


class WeightEntry(Base):
    __tablename__ = "weight_entries"
    __table_args__ = (UniqueConstraint("user_id", "entry_date", name="uq_user_entry_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utc_now)

    user: Mapped[User] = relationship("User", back_populates="weight_entries")
