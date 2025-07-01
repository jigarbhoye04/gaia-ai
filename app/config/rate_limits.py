"""
Rate limiting configuration for all features.
Single source of truth for rate limits.
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict
from pydantic import BaseModel

from app.models.payment_models import PlanType


class RateLimitPeriod(str, Enum):
    HOUR = "hour"
    DAY = "day"
    MONTH = "month"


class RateLimitConfig(BaseModel):
    hour: int = 0
    day: int = 0
    month: int = 0
    tokens_per_request: int = 0


class TieredRateLimits(BaseModel):
    free: RateLimitConfig = RateLimitConfig()
    pro: RateLimitConfig = RateLimitConfig()


# All feature rate limits in one place
FEATURE_LIMITS: Dict[str, TieredRateLimits] = {
    "image_generation": TieredRateLimits(
        free=RateLimitConfig(hour=10, day=50),
        pro=RateLimitConfig(hour=100, day=1000)
    ),
    "file_analysis": TieredRateLimits(
        free=RateLimitConfig(hour=20, day=100),
        pro=RateLimitConfig(hour=200, day=2000)
    ),
    "chat_messages": TieredRateLimits(
        free=RateLimitConfig(hour=50, day=200),
        pro=RateLimitConfig(hour=500, day=5000)
    ),
    "api_calls": TieredRateLimits(
        free=RateLimitConfig(hour=30, day=150),
        pro=RateLimitConfig(hour=300, day=3000)
    ),
    "document_search": TieredRateLimits(
        free=RateLimitConfig(hour=25, day=100),
        pro=RateLimitConfig(hour=250, day=2500)
    ),
    "web_search": TieredRateLimits(
        free=RateLimitConfig(hour=15, day=75),
        pro=RateLimitConfig(hour=150, day=1500)
    ),
    "calendar": TieredRateLimits(
        free=RateLimitConfig(hour=40, day=200),
        pro=RateLimitConfig(hour=400, day=4000)
    ),
    "email": TieredRateLimits(
        free=RateLimitConfig(hour=20, day=100),
        pro=RateLimitConfig(hour=200, day=2000)
    ),
    "notes": TieredRateLimits(
        free=RateLimitConfig(hour=60, day=300),
        pro=RateLimitConfig(hour=600, day=6000)
    ),
    "goals": TieredRateLimits(
        free=RateLimitConfig(hour=30, day=150),
        pro=RateLimitConfig(hour=300, day=3000)
    ),
    "todos": TieredRateLimits(
        free=RateLimitConfig(hour=100, day=500),
        pro=RateLimitConfig(hour=1000, day=10000)
    ),
    "memory": TieredRateLimits(
        free=RateLimitConfig(hour=40, day=200),
        pro=RateLimitConfig(hour=400, day=4000)
    ),
    "browser": TieredRateLimits(
        free=RateLimitConfig(hour=10, day=50),
        pro=RateLimitConfig(hour=100, day=1000)
    ),
}


def get_feature_limits(feature_key: str) -> TieredRateLimits:
    """Get rate limits for a specific feature."""
    if feature_key not in FEATURE_LIMITS:
        raise ValueError(f"Unknown feature key: {feature_key}")
    return FEATURE_LIMITS[feature_key]


def get_limits_for_plan(feature_key: str, plan_type: PlanType) -> RateLimitConfig:
    """Get rate limits for a specific feature and plan."""
    limits = get_feature_limits(feature_key)
    return limits.free if plan_type == PlanType.FREE else limits.pro


def get_reset_time(period: RateLimitPeriod) -> datetime:
    """Calculate reset time for a given period."""
    now = datetime.now(timezone.utc)
    if period == RateLimitPeriod.HOUR:
        return now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    elif period == RateLimitPeriod.DAY:
        return now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    else:  # MONTH
        if now.month == 12:
            return now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            return now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)


def get_time_window_key(period: RateLimitPeriod) -> str:
    """Get Redis time window key for a period."""
    now = datetime.now(timezone.utc)
    if period == RateLimitPeriod.HOUR:
        return now.strftime("%Y%m%d%H")
    elif period == RateLimitPeriod.DAY:
        return now.strftime("%Y%m%d")
    else:  # MONTH
        return now.strftime("%Y%m")


def list_all_features() -> list[str]:
    """Get a list of all available feature keys."""
    return list(FEATURE_LIMITS.keys())