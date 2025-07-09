"""
Subscription management service.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from bson import ObjectId
from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import plans_collection, subscriptions_collection
from app.models.payment_models import (
    CreateSubscriptionRequest,
    PlanType,
    SubscriptionDB,
    SubscriptionResponse,
    SubscriptionStatus,
    UpdateSubscriptionRequest,
    UserSubscriptionStatus,
)
from app.services.user_service import get_user_by_id
from app.utils.payments_utils import calculate_subscription_dates, timestamp_to_datetime
from app.utils.timezone import add_timezone_info

from .client import razorpay_service
from .plans import get_plan_by_id, get_razorpay_plan_id


async def create_subscription(
    user_id: str, subscription_data: CreateSubscriptionRequest
) -> SubscriptionResponse:
    """Create a new subscription for a user."""
    try:
        # Validate user exists
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate plan exists
        plan = await get_plan_by_id(subscription_data.plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        # Check for existing active subscriptions
        existing_sub = await subscriptions_collection.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["active", "authenticated"]},
            }
        )

        if existing_sub:
            raise HTTPException(
                status_code=409, detail="User already has an active subscription"
            )

        # Clean up old failed/abandoned subscriptions
        await _cleanup_old_subscriptions(user_id)

        # Get Razorpay plan ID
        razorpay_plan_id = await get_razorpay_plan_id(subscription_data.plan_id)

        # Create subscription in Razorpay
        razorpay_subscription = await _create_razorpay_subscription(
            user_id, subscription_data, razorpay_plan_id, user
        )

        # Store subscription in database
        try:
            current_time = datetime.now(timezone.utc)

            # Calculate all date fields with sensible defaults
            dates = calculate_subscription_dates(
                plan, current_time, razorpay_subscription
            )

            # Create subscription document
            subscription_doc = _create_subscription_doc(
                razorpay_subscription, user_id, subscription_data, dates, current_time
            )

            result = await subscriptions_collection.insert_one(
                subscription_doc.dict(by_alias=True, exclude={"id"})
            )
            subscription_doc.id = str(result.inserted_id)

            if not result.inserted_id:
                raise HTTPException(
                    status_code=500, detail="Failed to store subscription in database"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store subscription in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to save subscription")

        logger.info(
            f"Successfully created subscription for user {user_id}: {subscription_doc.id}"
        )

        return SubscriptionResponse(
            id=subscription_doc.id,
            razorpay_subscription_id=subscription_doc.razorpay_subscription_id,
            user_id=subscription_doc.user_id,
            plan_id=subscription_doc.plan_id,
            status=SubscriptionStatus(subscription_doc.status),
            quantity=subscription_doc.quantity,
            current_start=subscription_doc.current_start,
            current_end=subscription_doc.current_end,
            ended_at=subscription_doc.ended_at,
            charge_at=subscription_doc.charge_at,
            start_at=subscription_doc.start_at,
            end_at=subscription_doc.end_at,
            auth_attempts=subscription_doc.auth_attempts,
            total_count=subscription_doc.total_count,
            paid_count=subscription_doc.paid_count,
            customer_notify=subscription_doc.customer_notify,
            created_at=subscription_doc.created_at,
            updated_at=subscription_doc.updated_at,
            notes=subscription_doc.notes,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")


async def get_user_subscription_status(user_id: str) -> UserSubscriptionStatus:
    """Get user's current subscription status."""
    try:
        # Get user's active subscription
        subscription = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": {"$in": ["active", "paused", "created"]}}
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
                # Legacy fields
                has_subscription=False,
                plan_type=PlanType.FREE,
                status=SubscriptionStatus.CANCELLED,
                cancel_at_period_end=False,
                current_period_end=None,
                current_period_start=None,
                plan_id=None,
                subscription_id=None,
                trial_end=None,
            )

        # Get plan details
        plan = await plans_collection.find_one(
            {"_id": ObjectId(subscription["plan_id"])}
        )

        plan_type = PlanType.FREE  # Default to free plan
        if plan:
            plan_name = plan.get("name", "").lower()
            if "pro" in plan_name:
                plan_type = PlanType.PRO

        logger.info(f"current_end: {subscription.get('current_end')}")
        logger.info(f"current_start: {datetime.now(timezone.utc)}")

        # Calculate days remaining
        days_remaining = None
        if subscription.get("current_end"):
            remaining_delta = add_timezone_info(
                target_datetime=subscription["current_end"], timezone_name="UTC"
            ) - datetime.now(timezone.utc)
            days_remaining = max(0, remaining_delta.days)

        # Format plan and subscription data
        current_plan = None
        if plan:
            current_plan = {
                "id": str(plan["_id"]),
                "name": plan["name"],
                "description": plan.get("description"),
                "amount": plan["amount"],
                "currency": plan["currency"],
                "duration": plan["duration"],
                "features": plan.get("features", []),
                "is_active": plan.get("is_active", True),
            }

        subscription_data = {
            "id": str(subscription["_id"]),
            "razorpay_subscription_id": subscription.get("razorpay_subscription_id"),
            "user_id": subscription["user_id"],
            "plan_id": subscription["plan_id"],
            "status": subscription["status"],
            "quantity": subscription.get("quantity", 1),
            "current_start": subscription.get("current_start"),
            "current_end": subscription.get("current_end"),
            "auth_attempts": subscription.get("auth_attempts", 0),
            "total_count": subscription.get("total_count", 0),
            "paid_count": subscription.get("paid_count", 0),
            "customer_notify": subscription.get("customer_notify", True),
            "created_at": subscription.get("created_at"),
            "updated_at": subscription.get("updated_at"),
        }

        return UserSubscriptionStatus(
            user_id=user_id,
            current_plan=current_plan,
            subscription=subscription_data,
            is_subscribed=True,
            days_remaining=days_remaining,
            can_upgrade=plan_type != PlanType.PRO,
            can_downgrade=plan_type not in [PlanType.FREE],
            # Legacy fields for backward compatibility
            has_subscription=True,
            plan_type=plan_type,
            status=SubscriptionStatus(subscription["status"]),
            current_period_start=subscription.get("current_start"),
            current_period_end=subscription.get("current_end"),
            cancel_at_period_end=subscription.get("cancel_at_cycle_end", False),
            trial_end=subscription.get("trial_end"),
            subscription_id=subscription.get("razorpay_subscription_id"),
            plan_id=subscription["plan_id"],
        )

    except Exception as e:
        logger.error(f"Error getting subscription status for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")


async def update_subscription(
    user_id: str, subscription_data: UpdateSubscriptionRequest
) -> SubscriptionResponse:
    """Update user's subscription with proper error handling and rollback."""
    try:
        # Get current subscription
        current_subscription = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": {"$in": ["active", "created"]}}
        )

        if not current_subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        razorpay_subscription_id = current_subscription["razorpay_subscription_id"]

        # Prepare update data for Razorpay
        update_data: Dict[str, Any] = {}
        if subscription_data.plan_id:
            razorpay_plan_id = await get_razorpay_plan_id(subscription_data.plan_id)
            update_data["plan_id"] = razorpay_plan_id

        if subscription_data.quantity is not None:
            update_data["quantity"] = subscription_data.quantity

        if subscription_data.remaining_count is not None:
            update_data["remaining_count"] = subscription_data.remaining_count

        if subscription_data.replace_items is not None:
            update_data["replace_items"] = subscription_data.replace_items

        if subscription_data.prorate is not None:
            update_data["prorate"] = subscription_data.prorate

        # Update subscription in Razorpay
        try:
            updated_subscription = razorpay_service.client.subscription.update(
                razorpay_subscription_id, update_data
            )
            logger.info(f"Updated Razorpay subscription: {razorpay_subscription_id}")
        except Exception as e:
            logger.error(f"Failed to update Razorpay subscription: {e}")
            raise HTTPException(
                status_code=502,
                detail="Failed to update subscription in payment gateway",
            )

        # Update subscription in database
        db_update_data: Dict[str, Any] = {
            "updated_at": datetime.now(timezone.utc),
        }

        if subscription_data.plan_id:
            db_update_data["plan_id"] = subscription_data.plan_id

        if subscription_data.quantity is not None:
            db_update_data["quantity"] = subscription_data.quantity

        result = await subscriptions_collection.update_one(
            {"_id": ObjectId(current_subscription["_id"])}, {"$set": db_update_data}
        )

        if result.modified_count == 0:
            logger.warning(f"No subscription updated in database for user {user_id}")

        # Fetch updated subscription
        updated_subscription_doc = await subscriptions_collection.find_one(
            {"_id": ObjectId(current_subscription["_id"])}
        )

        return SubscriptionResponse(
            id=str(updated_subscription_doc["_id"]),
            razorpay_subscription_id=updated_subscription_doc[
                "razorpay_subscription_id"
            ],
            user_id=updated_subscription_doc["user_id"],
            plan_id=updated_subscription_doc["plan_id"],
            status=SubscriptionStatus(updated_subscription_doc["status"]),
            quantity=updated_subscription_doc["quantity"],
            current_start=updated_subscription_doc.get("current_start"),
            current_end=updated_subscription_doc.get("current_end"),
            ended_at=updated_subscription_doc.get("ended_at"),
            charge_at=updated_subscription_doc.get("charge_at"),
            start_at=updated_subscription_doc.get("start_at"),
            end_at=updated_subscription_doc.get("end_at"),
            auth_attempts=updated_subscription_doc.get("auth_attempts", 0),
            total_count=updated_subscription_doc["total_count"],
            paid_count=updated_subscription_doc["paid_count"],
            customer_notify=updated_subscription_doc["customer_notify"],
            created_at=updated_subscription_doc["created_at"],
            updated_at=updated_subscription_doc["updated_at"],
            notes=updated_subscription_doc.get("notes", {}),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating subscription for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update subscription")


async def cancel_subscription(
    user_id: str, cancel_at_cycle_end: bool = True
) -> Dict[str, str]:
    """Cancel user's subscription with proper cleanup."""
    try:
        # Get current subscription
        subscription = await subscriptions_collection.find_one(
            {"user_id": user_id, "status": {"$in": ["active", "created"]}}
        )

        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        razorpay_subscription_id = subscription["razorpay_subscription_id"]

        # Cancel subscription in Razorpay
        try:
            if cancel_at_cycle_end:
                # Cancel at cycle end
                cancelled_subscription = razorpay_service.client.subscription.update(
                    razorpay_subscription_id, {"cancel_at_cycle_end": True}
                )
                new_status = "active"  # Remains active until cycle end
            else:
                # Cancel immediately
                cancelled_subscription = razorpay_service.client.subscription.cancel(
                    razorpay_subscription_id
                )
                new_status = "cancelled"

            logger.info(f"Cancelled Razorpay subscription: {razorpay_subscription_id}")
        except Exception as e:
            logger.error(f"Failed to cancel Razorpay subscription: {e}")
            raise HTTPException(
                status_code=502,
                detail="Failed to cancel subscription in payment gateway",
            )

        # Update subscription in database
        update_data = {
            "status": new_status,
            "cancel_at_cycle_end": cancel_at_cycle_end,
            "updated_at": datetime.now(timezone.utc),
        }

        if not cancel_at_cycle_end:
            update_data["ended_at"] = datetime.now(timezone.utc)

        result = await subscriptions_collection.update_one(
            {"_id": ObjectId(subscription["_id"])}, {"$set": update_data}
        )

        if result.modified_count == 0:
            logger.warning(f"No subscription updated in database for user {user_id}")

        return {
            "message": "Subscription cancelled successfully",
            "cancel_at_cycle_end": str(cancel_at_cycle_end),
            "status": new_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error cancelling subscription for user {user_id}: {e}"
        )
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


async def sync_subscription_from_razorpay(razorpay_subscription_id: str) -> bool:
    """Sync subscription data from Razorpay to fix missing fields."""
    try:
        # Fetch subscription details from Razorpay
        razorpay_subscription = razorpay_service.client.subscription.fetch(
            razorpay_subscription_id
        )

        # Get our plan details for calculating defaults
        subscription_doc = await subscriptions_collection.find_one(
            {"razorpay_subscription_id": razorpay_subscription_id}
        )

        if not subscription_doc:
            logger.error(
                f"Subscription not found in database: {razorpay_subscription_id}"
            )
            return False

        plan = await plans_collection.find_one(
            {"_id": ObjectId(subscription_doc["plan_id"])}
        )

        # Calculate updated fields
        current_start = timestamp_to_datetime(
            razorpay_subscription.get("current_start")
        )
        current_end = timestamp_to_datetime(razorpay_subscription.get("current_end"))
        charge_at = timestamp_to_datetime(razorpay_subscription.get("charge_at"))
        start_at = timestamp_to_datetime(razorpay_subscription.get("start_at"))
        end_at = timestamp_to_datetime(razorpay_subscription.get("end_at"))

        # Set defaults if fields are still null
        created_at = subscription_doc.get("created_at", datetime.now(timezone.utc))

        if not start_at:
            start_at = created_at

        if not current_start:
            current_start = start_at

        if not current_end and plan and current_start is not None:
            # Calculate end based on plan duration
            if plan.get("duration") == "monthly":
                current_end = current_start + timedelta(days=30)
            elif plan.get("duration") == "yearly":
                current_end = current_start + timedelta(days=365)

        if not charge_at:
            charge_at = current_start

        if not end_at and plan and start_at is not None:
            # Set to total billing cycles from start
            total_count = razorpay_subscription.get("total_count", 10)
            if plan.get("duration") == "monthly":
                end_at = start_at + timedelta(days=30 * total_count)
            elif plan.get("duration") == "yearly":
                end_at = start_at + timedelta(days=365 * total_count)

        # Update subscription in database
        update_data = {
            "status": razorpay_subscription["status"],
            "current_start": current_start,
            "current_end": current_end,
            "charge_at": charge_at,
            "start_at": start_at,
            "end_at": end_at,
            "auth_attempts": razorpay_subscription.get("auth_attempts", 0),
            "total_count": razorpay_subscription.get("total_count", 10),
            "paid_count": razorpay_subscription.get("paid_count", 0),
            "updated_at": datetime.now(timezone.utc),
        }

        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        result = await subscriptions_collection.update_one(
            {"razorpay_subscription_id": razorpay_subscription_id},
            {"$set": update_data},
        )

        if result.modified_count > 0:
            logger.info(
                f"Successfully synced subscription from Razorpay: {razorpay_subscription_id}"
            )
            return True
        else:
            logger.warning(
                f"No changes made to subscription: {razorpay_subscription_id}"
            )
            return False

    except Exception as e:
        logger.error(
            f"Failed to sync subscription from Razorpay {razorpay_subscription_id}: {e}"
        )
        return False


# Helper functions
async def _cleanup_old_subscriptions(user_id: str) -> None:
    """Clean up old failed/abandoned subscriptions for a user."""
    try:
        cleanup_result = await subscriptions_collection.delete_many(
            {
                "user_id": user_id,
                "$or": [
                    {
                        "status": "created",
                        "created_at": {
                            "$lt": datetime.now(timezone.utc) - timedelta(hours=1)
                        },
                    },
                    {"status": "failed"},
                ],
            }
        )

        if cleanup_result.deleted_count > 0:
            logger.info(
                f"Cleaned up {cleanup_result.deleted_count} failed subscriptions for user {user_id}"
            )
    except Exception as e:
        logger.warning(f"Failed to cleanup subscriptions for user {user_id}: {e}")


async def _create_razorpay_subscription(
    user_id: str,
    subscription_data: CreateSubscriptionRequest,
    razorpay_plan_id: str,
    user: Dict[str, Any],
) -> Dict[str, Any]:
    """Create subscription in Razorpay and return the subscription data."""
    razorpay_sub_data = {
        "plan_id": razorpay_plan_id,
        "quantity": subscription_data.quantity,
        "customer_notify": subscription_data.customer_notify,
        "total_count": 10,  # Razorpay's maximum allowed
        "addons": subscription_data.addons,
        "notes": {
            "user_id": user_id,
            "user_email": user["email"],
            **(subscription_data.notes or {}),
        },
    }

    try:
        razorpay_subscription = razorpay_service.client.subscription.create(
            razorpay_sub_data
        )
        mode = "test" if razorpay_service.is_test_mode else "live"
        logger.info(
            f"Created Razorpay subscription in {mode} mode: {razorpay_subscription['id']}"
        )
    except Exception as e:
        logger.error(f"Failed to create Razorpay subscription: {e}")
        raise HTTPException(
            status_code=502, detail="Failed to create subscription in payment gateway"
        )

    # Fetch latest subscription details to get any updated timestamps
    try:
        razorpay_subscription = razorpay_service.client.subscription.fetch(
            razorpay_subscription["id"]
        )
        logger.info(
            f"Fetched updated subscription details for: {razorpay_subscription['id']}"
        )
    except Exception as e:
        logger.warning(f"Failed to fetch updated subscription details: {e}")
        # Continue with original response

    return razorpay_subscription


def _create_subscription_doc(
    razorpay_subscription: Dict[str, Any],
    user_id: str,
    subscription_data: CreateSubscriptionRequest,
    dates: Dict[str, datetime],
    current_time: datetime,
) -> SubscriptionDB:
    """Create a SubscriptionDB document with all the necessary fields."""
    return SubscriptionDB(
        _id=None,  # Will be set by MongoDB
        razorpay_subscription_id=razorpay_subscription["id"],
        user_id=user_id,
        plan_id=subscription_data.plan_id,
        status=razorpay_subscription["status"],
        quantity=subscription_data.quantity,
        current_start=dates["current_start"],
        current_end=dates["current_end"],
        ended_at=None,
        charge_at=dates["charge_at"],
        start_at=dates["start_at"],
        end_at=dates["end_at"],
        auth_attempts=razorpay_subscription.get("auth_attempts", 0),
        total_count=razorpay_subscription.get("total_count", 10),
        paid_count=razorpay_subscription.get("paid_count", 0),
        customer_notify=subscription_data.customer_notify,
        notes=subscription_data.notes or {},
        created_at=current_time,
        updated_at=current_time,
    )
