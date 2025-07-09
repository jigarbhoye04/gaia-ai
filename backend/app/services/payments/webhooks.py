"""
Webhook event processing for Razorpay.
"""

from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import payments_collection, subscriptions_collection
from app.models.payment_models import WebhookEvent
from app.utils.payments_utils import timestamp_to_datetime

from .client import razorpay_service


async def process_webhook(event: WebhookEvent) -> Dict[str, str]:
    """Process Razorpay webhook events with proper error handling."""
    try:
        event_type = event.event
        entity = event.payload.get("payment", event.payload.get("subscription", {}))
        entity_id = entity.get("id")

        logger.info(f"Processing webhook event: {event_type} for entity: {entity_id}")

        if event_type.startswith("payment."):
            return await _process_payment_webhook(event_type, entity)
        elif event_type.startswith("subscription."):
            return await _process_subscription_webhook(event_type, entity)
        else:
            logger.warning(f"Unhandled webhook event type: {event_type}")
            return {"status": "ignored", "message": "Event type not handled"}

    except Exception as e:
        logger.error(f"Error processing webhook event {event.event}: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def _process_payment_webhook(
    event_type: str, payment_entity: Dict[str, Any]
) -> Dict[str, str]:
    """Process payment-related webhook events."""
    payment_id = payment_entity.get("id")

    if event_type == "payment.captured":
        # Update payment status to captured
        await payments_collection.update_one(
            {"razorpay_payment_id": payment_id},
            {
                "$set": {
                    "status": "captured",
                    "captured": True,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(f"Payment captured: {payment_id}")

    elif event_type == "payment.failed":
        # Update payment status to failed
        await payments_collection.update_one(
            {"razorpay_payment_id": payment_id},
            {
                "$set": {
                    "status": "failed",
                    "error_code": payment_entity.get("error_code"),
                    "error_description": payment_entity.get("error_description"),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(f"Payment failed: {payment_id}")

    return {"status": "processed", "event": event_type, "payment_id": payment_id}


async def _process_subscription_webhook(
    event_type: str, subscription_entity: Dict[str, Any]
) -> Dict[str, str]:
    """Process subscription-related webhook events."""
    subscription_id = subscription_entity.get("id")

    if event_type == "subscription.activated":
        # Activate subscription and fetch latest details from Razorpay
        try:
            # Fetch complete subscription details from Razorpay
            complete_subscription = razorpay_service.client.subscription.fetch(
                subscription_id
            )

            update_data = {
                "status": "active",
                "current_start": timestamp_to_datetime(
                    complete_subscription.get("current_start")
                ),
                "current_end": timestamp_to_datetime(
                    complete_subscription.get("current_end")
                ),
                "charge_at": timestamp_to_datetime(
                    complete_subscription.get("charge_at")
                ),
                "start_at": timestamp_to_datetime(
                    complete_subscription.get("start_at")
                ),
                "end_at": timestamp_to_datetime(complete_subscription.get("end_at")),
                "auth_attempts": complete_subscription.get("auth_attempts", 0),
                "total_count": complete_subscription.get("total_count", 10),
                "paid_count": complete_subscription.get("paid_count", 0),
                "updated_at": datetime.now(timezone.utc),
            }

            # Remove None values to avoid overwriting existing data
            update_data = {k: v for k, v in update_data.items() if v is not None}

            await subscriptions_collection.update_one(
                {"razorpay_subscription_id": subscription_id}, {"$set": update_data}
            )
        except Exception as e:
            logger.error(f"Failed to fetch complete subscription details: {e}")
            # Fallback to webhook data
            await subscriptions_collection.update_one(
                {"razorpay_subscription_id": subscription_id},
                {
                    "$set": {
                        "status": "active",
                        "current_start": timestamp_to_datetime(
                            subscription_entity.get("current_start")
                        ),
                        "current_end": timestamp_to_datetime(
                            subscription_entity.get("current_end")
                        ),
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
        logger.info(f"Subscription activated: {subscription_id}")

    elif event_type == "subscription.charged":
        # Update subscription payment count and billing period
        try:
            # Fetch complete subscription details from Razorpay
            complete_subscription = razorpay_service.client.subscription.fetch(
                subscription_id
            )

            update_data = {
                "current_start": timestamp_to_datetime(
                    complete_subscription.get("current_start")
                ),
                "current_end": timestamp_to_datetime(
                    complete_subscription.get("current_end")
                ),
                "charge_at": timestamp_to_datetime(
                    complete_subscription.get("charge_at")
                ),
                "paid_count": complete_subscription.get("paid_count", 0),
                "updated_at": datetime.now(timezone.utc),
            }

            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}

            await subscriptions_collection.update_one(
                {"razorpay_subscription_id": subscription_id},
                {
                    "$set": update_data,
                    "$inc": (
                        {"paid_count": 1} if "paid_count" not in update_data else {}
                    ),
                },
            )
        except Exception as e:
            logger.error(f"Failed to fetch complete subscription details: {e}")
            # Fallback to webhook data
            await subscriptions_collection.update_one(
                {"razorpay_subscription_id": subscription_id},
                {
                    "$inc": {"paid_count": 1},
                    "$set": {
                        "current_start": timestamp_to_datetime(
                            subscription_entity.get("current_start")
                        ),
                        "current_end": timestamp_to_datetime(
                            subscription_entity.get("current_end")
                        ),
                        "updated_at": datetime.now(timezone.utc),
                    },
                },
            )
        logger.info(f"Subscription charged: {subscription_id}")

    elif event_type == "subscription.cancelled":
        # Cancel subscription
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$set": {
                    "status": "cancelled",
                    "ended_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(f"Subscription cancelled: {subscription_id}")

    elif event_type == "subscription.completed":
        # Complete subscription
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$set": {
                    "status": "completed",
                    "ended_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.info(f"Subscription completed: {subscription_id}")

    return {
        "status": "processed",
        "event": event_type,
        "subscription_id": subscription_id,
    }
