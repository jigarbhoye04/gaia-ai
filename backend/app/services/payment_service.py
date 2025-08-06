"""
Streamlined Dodo Payments integration service.
Clean, simple, and maintainable.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List

from bson import ObjectId
from dodopayments import DodoPayments
from fastapi import HTTPException

from app.config.settings import settings
from app.db.mongodb.collections import (
    plans_collection,
    subscriptions_collection,
    users_collection,
)
from app.db.redis import redis_cache
from app.db.utils import serialize_document
from app.models.payment_models import (
    PlanResponse,
    PlanType,
    SubscriptionStatus,
    UserSubscriptionStatus,
)
from app.utils.email_utils import send_pro_subscription_email


class DodoPaymentService:
    """Streamlined Dodo Payments service."""

    def __init__(self):
        try:
            environment = "live_mode" if settings.ENV == "production" else "test_mode"

            self.client = DodoPayments(
                bearer_token=settings.DODO_PAYMENTS_API_KEY,
                environment=environment,
            )
        except Exception as e:
            print(f"Failed to instantiate dodo payments: {e}")

    async def get_plans(self, active_only: bool = True) -> List[PlanResponse]:
        """Get subscription plans with caching."""
        cache_key = f"plans:{'active' if active_only else 'all'}"

        # Try cache first
        cached = await redis_cache.get(cache_key)
        if cached:
            return [PlanResponse(**plan) for plan in cached]

        # Fetch from database
        query = {"is_active": True} if active_only else {}
        plans = await plans_collection.find(query).sort("amount", 1).to_list(None)

        plan_responses = [
            PlanResponse(
                id=str(plan["_id"]),
                name=plan["name"],
                description=plan.get("description"),
                amount=plan["amount"],
                currency=plan["currency"],
                duration=plan["duration"],
                max_users=plan.get("max_users"),
                features=plan.get("features", []),
                is_active=plan["is_active"],
                created_at=plan["created_at"],
                updated_at=plan["updated_at"],
            )
            for plan in plans
        ]

        # Cache result
        await redis_cache.set(cache_key, [plan.model_dump() for plan in plan_responses])
        return plan_responses

    async def create_subscription(
        self, user_id: str, product_id: str, quantity: int = 1
    ) -> Dict[str, Any]:
        """Create subscription - backend handles all security."""
        # Get user
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(404, "User not found")

        # Check for existing subscription
        existing = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": {"$in": ["pending", "active"]}}
        )
        if existing:
            raise HTTPException(409, "Active subscription exists")

        # Create with Dodo
        try:
            subscription = self.client.subscriptions.create(
                billing={
                    "city": "N/A",
                    "country": "IN",
                    "state": "N/A",
                    "street": "N/A",
                    "zipcode": "000000",
                },
                customer={"customer_id": user_id},
                product_id=product_id,
                quantity=quantity,
                payment_link=True,
                return_url=f"{settings.FRONTEND_URL}/payment/success",
            )
        except Exception as e:
            raise HTTPException(502, f"Payment service error: {str(e)}")

        # Store in database - create dict directly for insertion
        subscription_doc = {
            "dodo_subscription_id": subscription.subscription_id,
            "user_id": user_id,
            "product_id": product_id,
            "status": "pending",
            "quantity": quantity,
            "payment_link": getattr(subscription, "payment_link", None),
            "webhook_verified": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "metadata": {"user_email": user.get("email")},
        }

        await subscriptions_collection.insert_one(subscription_doc)

        return {
            "subscription_id": subscription.subscription_id,
            "payment_link": getattr(subscription, "payment_link", None),
            "status": "pending",
        }

    async def verify_payment_completion(self, user_id: str) -> Dict[str, Any]:
        """Check payment completion status."""
        subscription = await subscriptions_collection.find_one(
            {"user_id": user_id}, sort=[("created_at", -1)]
        )

        if not subscription:
            return {"payment_completed": False, "message": "No subscription found"}

        if subscription["status"] == "active" and subscription.get("webhook_verified"):
            # Send welcome email (don't fail if email fails)
            try:
                user = await users_collection.find_one({"_id": ObjectId(user_id)})
                if user and user.get("email"):
                    await send_pro_subscription_email(
                        user_name=user.get("first_name", "User"),
                        user_email=user["email"],
                    )
            except Exception:
                pass  # Email failure shouldn't break payment verification

            return {
                "payment_completed": True,
                "subscription_id": subscription["dodo_subscription_id"],
                "message": "Payment completed",
            }

        return {
            "payment_completed": False,
            "subscription_id": subscription.get("dodo_subscription_id"),
            "message": "Payment pending",
        }

    async def get_user_subscription_status(
        self, user_id: str
    ) -> UserSubscriptionStatus:
        """Get user subscription status."""
        subscription = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": "active"}
        )

        if not subscription:
            return UserSubscriptionStatus(
                user_id=user_id,
                current_plan=None,
                subscription=None,
                is_subscribed=False,
                days_remaining=None,
                can_upgrade=True,
                can_downgrade=False,
                has_subscription=False,
                plan_type=PlanType.FREE,
                status=SubscriptionStatus.PENDING,
            )

        # Get plan details
        try:
            plans = await self.get_plans(active_only=False)
            plan = next(
                (p for p in plans if p.id == subscription.get("product_id")), None
            )
        except Exception:
            plan = None

        return UserSubscriptionStatus(
            user_id=user_id,
            current_plan=plan.model_dump() if plan else None,
            subscription=serialize_document(subscription),
            is_subscribed=True,
            days_remaining=None,
            can_upgrade=True,
            can_downgrade=True,
            has_subscription=True,
            plan_type=PlanType.PRO,
            status=SubscriptionStatus(subscription["status"]),
        )

    async def handle_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, str]:
        """Handle Dodo webhook."""
        subscription_id = webhook_data.get("subscription_id")
        status = webhook_data.get("status")

        if not subscription_id or not status:
            raise HTTPException(400, "Invalid webhook data")

        result = await subscriptions_collection.update_one(
            {"dodo_subscription_id": subscription_id},
            {
                "$set": {
                    "status": status,
                    "webhook_verified": True,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return {
            "status": "processed" if result.modified_count > 0 else "not_found",
            "subscription_id": subscription_id,
        }


print(f"{settings.DODO_PAYMENTS_API_KEY=}")

payment_service = DodoPaymentService()
