"""
OAuth Token Models

This module defines SQLAlchemy models for OAuth tokens.
"""

from datetime import datetime

from app.db.postgresql import Base
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func


class OAuthToken(Base):
    """SQLAlchemy model for OAuth tokens."""

    __tablename__ = "oauth_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_data: Mapped[str] = mapped_column(
        Text, nullable=False, comment="JSON serialized token data"
    )
    scopes: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="Space-separated OAuth scopes"
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), onupdate=func.now(), nullable=False
    )

    # __table_args__ = (
    #     Index("ix_oauth_tokens_user_id", "user_id"),
    #     UniqueConstraint("access_token", name="uq_oauth_tokens_access_token"),
    #     {"sqlite_autoincrement": True},
    # )
