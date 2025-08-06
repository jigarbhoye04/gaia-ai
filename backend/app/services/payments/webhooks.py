"""
Webhook event processing for Razorpay.
"""

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import (
    payments_collection,
    subscriptions_collection,
    webhook_events_collection,
)
from app.models.payment_models import WebhookEvent
from app.models.webhook_models import WebhookEventDB
from app.utils.payments_utils import timestamp_to_datetime

from .client import razorpay_service


async def process_webhook(event: WebhookEvent) -> Dict[str, str]:
    """Process Razorpay webhook events with idempotency."""
    event_type = event.event
    entity = event.payload.get("payment", event.payload.get("subscription", {}))
    entity_id = entity.get("id")

    try:
        # Generate payload hash for idempotency
        payload_str = f"{event_type}:{entity_id}:{entity.get('status', '')}"
        payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        logger.info(f"Processing webhook event: {event_type} for entity: {entity_id}")

        # Check if we've already processed this exact event
        existing_event = await webhook_events_collection.find_one(
            {
                "$or": [
                    {"event_id": f"{event_type}_{entity_id}"},
                    {"payload_hash": payload_hash},
                ]
            }
        )

        if existing_event and existing_event.get("status") == "processed":
            logger.info(f"Event already processed: {event_type}_{entity_id}")
            return {"status": "already_processed", "event": event_type}

        # Record the webhook event
        webhook_event_doc = WebhookEventDB(
            _id=None,
            event_id=f"{event_type}_{entity_id}",
            event_type=event_type,
            razorpay_entity_id=entity_id,
            processed_at=datetime.now(timezone.utc),
            payload_hash=payload_hash,
            status="processing",
        )

        await webhook_events_collection.insert_one(
            webhook_event_doc.dict(by_alias=True, exclude={"id"})
        )

        # Process the webhook
        if event_type.startswith("payment."):
            result = await _process_payment_webhook(event_type, entity)
        elif event_type.startswith("subscription."):
            result = await _process_subscription_webhook(event_type, entity)
        else:
            logger.warning(f"Unhandled webhook event type: {event_type}")
            result = {"status": "ignored", "message": "Event type not handled"}

        # Mark as processed
        await webhook_events_collection.update_one(
            {"event_id": f"{event_type}_{entity_id}"}, {"$set": {"status": "processed"}}
        )

        logger.info(f"Webhook processed successfully: {event_type}")
        return result

    except Exception as e:
        # Mark as failed
        event_id = f"{event_type}_{entity_id}" if entity_id else f"{event_type}_unknown"
        await webhook_events_collection.update_one(
            {"event_id": event_id},
            {
                "$set": {"status": "failed", "error_message": str(e)},
                "$inc": {"retry_count": 1},
            },
        )

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

    return {
        "status": "processed",
        "event": event_type,
        "payment_id": str(payment_id) if payment_id else "",
    }


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
        "subscription_id": str(subscription_id) if subscription_id else "",
    }
