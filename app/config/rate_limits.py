"""
Rate limiting configuration for all features.
Single source of truth for rate limits.

Rate limits are enforced across two time periods:
- Daily: Medium-term usage control  
- Monthly: Long-term subscription limits

Both limits are checked on each request. If any limit is exceeded,
the request is rejected with a 429 status code.

Usage:
    @tiered_rate_limit("image_generation")
    async def generate_image(user: dict = Depends(get_current_user)):
        # This endpoint will be limited by daily (50/1000) and monthly (1000/25000) 
        # limits based on user's plan
        pass
"""

from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict
from pydantic import BaseModel

from app.models.payment_models import PlanType


class RateLimitPeriod(str, Enum):
    DAY = "day"
    MONTH = "month"


class RateLimitConfig(BaseModel):
    day: int = 0
    month: int = 0
    tokens_per_request: int = 0


class FeatureInfo(BaseModel):
    title: str
    description: str


class TieredRateLimits(BaseModel):
    free: RateLimitConfig = RateLimitConfig()
    pro: RateLimitConfig = RateLimitConfig()
    info: FeatureInfo


# All feature rate limits in one place
FEATURE_LIMITS: Dict[str, TieredRateLimits] = {
    "image_generation": TieredRateLimits(
        free=RateLimitConfig(day=1, month=1000),
        pro=RateLimitConfig(day=1, month=25000),
        info=FeatureInfo(title="AI Image Generation", description="Generate images using AI models")
    ),
    "file_analysis": TieredRateLimits(
        free=RateLimitConfig(day=100, month=2000),
        pro=RateLimitConfig(day=2000, month=50000),
        info=FeatureInfo(title="File Analysis", description="Analyze and process uploaded files")
    ),
    "chat_messages": TieredRateLimits(
        free=RateLimitConfig(day=200, month=5000),
        pro=RateLimitConfig(day=5000, month=125000),
        info=FeatureInfo(title="Chat Messages", description="Send messages to AI assistants")
    ),
    "api_calls": TieredRateLimits(
        free=RateLimitConfig(day=150, month=3000),
        pro=RateLimitConfig(day=3000, month=75000),
        info=FeatureInfo(title="API Calls", description="Make API calls to external services")
    ),
    "document_search": TieredRateLimits(
        free=RateLimitConfig(day=100, month=2500),
        pro=RateLimitConfig(day=2500, month=62500),
        info=FeatureInfo(title="Document Search", description="Search through documents and knowledge base")
    ),
    "web_search": TieredRateLimits(
        free=RateLimitConfig(day=75, month=1500),
        pro=RateLimitConfig(day=1500, month=37500),
        info=FeatureInfo(title="Web Search", description="Search the web for information")
    ),
    "calendar": TieredRateLimits(
        free=RateLimitConfig(day=200, month=4000),
        pro=RateLimitConfig(day=4000, month=100000),
        info=FeatureInfo(title="Calendar Operations", description="Manage calendar events and schedules")
    ),
    "email": TieredRateLimits(
        free=RateLimitConfig(day=100, month=2000),
        pro=RateLimitConfig(day=2000, month=50000),
        info=FeatureInfo(title="Email Operations", description="Send and manage emails")
    ),
    "notes": TieredRateLimits(
        free=RateLimitConfig(day=300, month=6000),
        pro=RateLimitConfig(day=6000, month=150000),
        info=FeatureInfo(title="Notes & Memories", description="Create and manage notes")
    ),
    "goals": TieredRateLimits(
        free=RateLimitConfig(day=150, month=3000),
        pro=RateLimitConfig(day=3000, month=75000),
        info=FeatureInfo(title="Goal Management", description="Track and manage goals")
    ),
    "todos": TieredRateLimits(
        free=RateLimitConfig(day=500, month=10000),
        pro=RateLimitConfig(day=10000, month=250000),
        info=FeatureInfo(title="Todo Management", description="Manage tasks and todos")
    ),
    "memory": TieredRateLimits(
        free=RateLimitConfig(day=200, month=4000),
        pro=RateLimitConfig(day=4000, month=100000),
        info=FeatureInfo(title="Memory Operations", description="Store and retrieve memories")
    ),
    "browser": TieredRateLimits(
        free=RateLimitConfig(day=50, month=1000),
        pro=RateLimitConfig(day=1000, month=25000),
        info=FeatureInfo(title="Browser Automation", description="Automate browser operations")
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
    if period == RateLimitPeriod.DAY:
        return now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    else:  # MONTH
        if now.month == 12:
            return now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            return now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)


def get_time_window_key(period: RateLimitPeriod) -> str:
    """Get Redis time window key for a period."""
    now = datetime.now(timezone.utc)
    if period == RateLimitPeriod.DAY:
        return now.strftime("%Y%m%d")
    else:  # MONTH
        return now.strftime("%Y%m")


def get_feature_info(feature_key: str) -> Dict[str, str]:
    """Get user-friendly feature information."""
    if feature_key in FEATURE_LIMITS:
        info = FEATURE_LIMITS[feature_key].info
        return {
            "title": info.title,
            "description": info.description
        }
    return {
        "title": feature_key.replace("_", " ").title(),
        "description": f"Usage for {feature_key}"
    }


def list_all_features() -> list[str]:
    """Get a list of all available feature keys."""
    return list(FEATURE_LIMITS.keys())