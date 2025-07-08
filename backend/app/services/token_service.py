"""
Token tracking and management service.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, Any

from app.db.redis import redis_cache
from app.models.payment_models import PlanType

# Constants
SECONDS_PER_DAY = 86400
DAYS_IN_MONTH = 30


class TokenService:
    """Service for tracking token usage across features."""

    def __init__(self):
        self.redis = redis_cache

    async def track_token_usage(
        self, user_id: str, feature_key: str, tokens_used: int, _plan_type: PlanType
    ) -> None:
        """Track token usage for a user and feature."""
        if tokens_used <= 0:
            return

        # Track tokens per feature per day
        date_key = datetime.now(timezone.utc).strftime("%Y%m%d")
        redis_key = f"tokens:{user_id}:{feature_key}:{date_key}"

        await self.redis.redis.incrby(redis_key, tokens_used)
        await self.redis.redis.expire(redis_key, SECONDS_PER_DAY)

    async def get_token_usage(
        self, user_id: str, feature_key: str = None, days: int = 1
    ) -> Dict[str, int]:
        """Get token usage for the last N days."""
        usage = {}

        for i in range(days):
            date = datetime.now(timezone.utc) - timedelta(days=i)
            date_key = date.strftime("%Y%m%d")

            if feature_key:
                redis_key = f"tokens:{user_id}:{feature_key}:{date_key}"
                tokens = await self.redis.get(redis_key)
                usage[date_key] = int(tokens) if tokens else 0
            else:
                # Get all features for this date
                pattern = f"tokens:{user_id}:*:{date_key}"
                total = 0
                async for key in self.redis.redis.scan_iter(match=pattern):
                    tokens = await self.redis.get(key)
                    total += int(tokens) if tokens else 0
                usage[date_key] = total

        return usage

    async def get_token_limits(
        self, _user_id: str, plan_type: PlanType
    ) -> Dict[str, int]:
        """Get token limits based on plan type."""
        # Base limits that apply across all features
        if plan_type == PlanType.FREE:
            return {"daily": 10000, "monthly": 200000}
        else:  # PRO
            return {"daily": 100000, "monthly": 2000000}

    async def get_token_usage_summary(
        self, user_id: str, plan_type: PlanType
    ) -> Dict[str, Any]:
        """Get comprehensive token usage summary."""
        # Get daily usage
        daily_usage = await self.get_token_usage(user_id, days=1)
        today_usage = daily_usage.get(datetime.now(timezone.utc).strftime("%Y%m%d"), 0)

        # Get monthly usage (last 30 days)
        monthly_usage_data = await self.get_token_usage(user_id, days=DAYS_IN_MONTH)
        monthly_usage = sum(monthly_usage_data.values())

        # Get limits
        limits = await self.get_token_limits(user_id, plan_type)

        return {
            "daily": {
                "used": today_usage,
                "limit": limits["daily"],
                "percentage": (
                    (today_usage / limits["daily"] * 100) if limits["daily"] > 0 else 0
                ),
                "remaining": max(0, limits["daily"] - today_usage),
            },
            "monthly": {
                "used": monthly_usage,
                "limit": limits["monthly"],
                "percentage": (
                    (monthly_usage / limits["monthly"] * 100)
                    if limits["monthly"] > 0
                    else 0
                ),
                "remaining": max(0, limits["monthly"] - monthly_usage),
            },
            "plan_type": (
                plan_type.value if hasattr(plan_type, "value") else str(plan_type)
            ),
        }


# Global instance
token_service = TokenService()
