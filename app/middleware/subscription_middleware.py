"""
Middleware for subscription and payment-related access control.
"""

from datetime import datetime
from typing import Optional

from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import plans_collection, subscriptions_collection
from app.models.payment_models import PlanType

security = HTTPBearer()


class SubscriptionMiddleware:
    """Middleware to check user subscription status and permissions."""

    @staticmethod
    async def check_subscription_access(
        user_id: str, required_plan: Optional[PlanType] = None
    ) -> bool:
        """
        Check if user has valid subscription access.

        Args:
            user_id: User ID to check
            required_plan: Minimum plan type required (optional)

        Returns:
            bool: True if user has access, False otherwise
        """
        try:
            # Get user's active subscription
            subscription = await subscriptions_collection.find_one(
                {"user_id": user_id, "status": "active"}
            )

            if not subscription:
                return False

            # Check if subscription is not expired
            if subscription.get("current_end"):
                if subscription["current_end"] < datetime.utcnow():
                    return False

            # If no specific plan is required, any active subscription is valid
            if not required_plan:
                return True

            # Get plan details to check plan type
            plan = await plans_collection.find_one({"_id": subscription["plan_id"]})
            if not plan:
                return False

            # Check if user's plan meets the requirement
            user_plan_type = plan.get("name", "").lower()

            plan_hierarchy = {"free": 0, "basic": 1, "pro": 2, "enterprise": 3}

            user_plan_level = 0
            for plan_name, level in plan_hierarchy.items():
                if plan_name in user_plan_type:
                    user_plan_level = level
                    break

            required_plan_level = plan_hierarchy.get(required_plan.value, 0)

            return user_plan_level >= required_plan_level

        except Exception as e:
            logger.error(f"Error checking subscription access for user {user_id}: {e}")
            return False

    @staticmethod
    async def check_feature_limit(
        user_id: str, feature: str, current_usage: int
    ) -> bool:
        """
        Check if user has reached their feature limit.

        Args:
            user_id: User ID to check
            feature: Feature name (e.g., 'searches', 'notes', 'api_calls')
            current_usage: Current usage count

        Returns:
            bool: True if within limits, False if limit exceeded
        """
        try:
            # Get user's active subscription
            subscription = await subscriptions_collection.find_one(
                {"user_id": user_id, "status": "active"}
            )

            if not subscription:
                # Use free plan limits
                return await SubscriptionMiddleware._check_free_plan_limits(
                    feature, current_usage
                )

            # Get plan details
            plan = await plans_collection.find_one({"_id": subscription["plan_id"]})
            if not plan:
                return False

            # Define feature limits by plan type
            plan_name = plan.get("name", "").lower()

            if "free" in plan_name:
                return await SubscriptionMiddleware._check_free_plan_limits(
                    feature, current_usage
                )
            elif "basic" in plan_name:
                return await SubscriptionMiddleware._check_basic_plan_limits(
                    feature, current_usage
                )
            elif "pro" in plan_name:
                return await SubscriptionMiddleware._check_pro_plan_limits(
                    feature, current_usage
                )
            elif "enterprise" in plan_name:
                return True  # Unlimited for enterprise

            return False

        except Exception as e:
            logger.error(f"Error checking feature limits for user {user_id}: {e}")
            return False

    @staticmethod
    async def _check_free_plan_limits(feature: str, current_usage: int) -> bool:
        """Check limits for free plan."""
        limits = {
            "searches_per_day": 5,
            "notes_total": 100,
            "api_calls_per_hour": 10,
            "file_uploads_per_day": 5,
            "chat_messages_per_day": 50,
        }
        return current_usage < limits.get(feature, 0)

    @staticmethod
    async def _check_basic_plan_limits(feature: str, current_usage: int) -> bool:
        """Check limits for basic plan."""
        limits = {
            "searches_per_day": 1000,
            "notes_total": -1,  # Unlimited
            "api_calls_per_hour": 100,
            "file_uploads_per_day": 50,
            "chat_messages_per_day": 1000,
        }
        limit = limits.get(feature, 0)
        return limit == -1 or current_usage < limit

    @staticmethod
    async def _check_pro_plan_limits(feature: str, current_usage: int) -> bool:
        """Check limits for pro plan."""
        limits = {
            "searches_per_day": 5000,
            "notes_total": -1,  # Unlimited
            "api_calls_per_hour": 500,
            "file_uploads_per_day": 200,
            "chat_messages_per_day": 5000,
            "team_members": 5,
        }
        limit = limits.get(feature, 0)
        return limit == -1 or current_usage < limit


async def require_subscription(
    request: Request, required_plan: Optional[PlanType] = None
) -> bool:
    """
    Dependency to require valid subscription.

    Args:
        request: FastAPI request object
        required_plan: Minimum plan type required

    Returns:
        bool: True if subscription is valid

    Raises:
        HTTPException: If subscription is invalid or insufficient
    """
    # Get user from request state (assuming it's set by auth middleware)
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user authentication")

    # Check subscription access
    has_access = await SubscriptionMiddleware.check_subscription_access(
        user_id, required_plan
    )

    if not has_access:
        if required_plan:
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires a {required_plan.value} plan or higher. Please upgrade your subscription.",
            )
        else:
            raise HTTPException(
                status_code=403,
                detail="This feature requires an active subscription. Please subscribe to continue.",
            )

    return True


async def check_feature_usage(
    request: Request, feature: str, current_usage: int
) -> bool:
    """
    Dependency to check feature usage limits.

    Args:
        request: FastAPI request object
        feature: Feature name to check
        current_usage: Current usage count

    Returns:
        bool: True if within limits

    Raises:
        HTTPException: If limit is exceeded
    """
    # Get user from request state
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user authentication")

    # Check feature limits
    within_limits = await SubscriptionMiddleware.check_feature_limit(
        user_id, feature, current_usage
    )

    if not within_limits:
        raise HTTPException(
            status_code=429,
            detail=f"Feature usage limit exceeded for '{feature}'. Please upgrade your plan for higher limits.",
        )

    return True


async def get_user_plan_info(user_id: str) -> dict:
    """
    Get comprehensive plan information for a user.

    Args:
        user_id: User ID

    Returns:
        dict: Plan information including limits and current usage
    """
    try:
        # Get user's active subscription
        subscription = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": "active"}
        )

        if not subscription:
            return {
                "plan_type": "free",
                "plan_name": "Free Plan",
                "is_active": False,
                "limits": {
                    "searches_per_day": 5,
                    "notes_total": 100,
                    "api_calls_per_hour": 10,
                    "file_uploads_per_day": 5,
                    "chat_messages_per_day": 50,
                },
            }

        # Get plan details
        plan = await plans_collection.find_one({"_id": subscription["plan_id"]})
        if not plan:
            return {"error": "Plan not found"}

        plan_name = plan.get("name", "").lower()

        # Determine plan type and limits
        if "free" in plan_name:
            plan_type = "free"
            limits = {
                "searches_per_day": 5,
                "notes_total": 100,
                "api_calls_per_hour": 10,
                "file_uploads_per_day": 5,
                "chat_messages_per_day": 50,
            }
        elif "basic" in plan_name:
            plan_type = "basic"
            limits = {
                "searches_per_day": 1000,
                "notes_total": -1,
                "api_calls_per_hour": 100,
                "file_uploads_per_day": 50,
                "chat_messages_per_day": 1000,
            }
        elif "pro" in plan_name:
            plan_type = "pro"
            limits = {
                "searches_per_day": 5000,
                "notes_total": -1,
                "api_calls_per_hour": 500,
                "file_uploads_per_day": 200,
                "chat_messages_per_day": 5000,
                "team_members": 5,
            }
        else:  # enterprise
            plan_type = "enterprise"
            limits = {
                "searches_per_day": -1,
                "notes_total": -1,
                "api_calls_per_hour": -1,
                "file_uploads_per_day": -1,
                "chat_messages_per_day": -1,
                "team_members": -1,
            }

        return {
            "plan_type": plan_type,
            "plan_name": plan["name"],
            "plan_id": plan["_id"],
            "is_active": True,
            "current_period_end": subscription.get("current_end"),
            "limits": limits,
            "features": plan.get("features", []),
        }

    except Exception as e:
        logger.error(f"Error getting plan info for user {user_id}: {e}")
        return {"error": "Failed to get plan information"}
