"""
PostgreSQL Database Configuration

This module provides SQLAlchemy setup for PostgreSQL database connection.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.config.settings import settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

# Create a SQLAlchemy base class for declarative models
Base = declarative_base()

# Create async engine
engine = create_async_engine(
    url=settings.POSTGRES_URL,
    future=True,
    pool_pre_ping=True,
    poolclass=NullPool if settings.ENV == "test" else None,
)


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get a SQLAlchemy session as an async context manager.

    Yields:
        AsyncSession: SQLAlchemy async session
    """
    async with AsyncSession(engine) as session:
        try:
            yield session
        finally:
            await session.close()


async def init_postgresql_db() -> None:
    """
    Initialize database by creating all tables.
    Should be called during application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_postgresql_db() -> None:
    """
    Close database connections.
    Should be called during application shutdown.
    """
    await engine.dispose()
