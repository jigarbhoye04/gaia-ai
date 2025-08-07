"""
Payment webhook service for Dodo Payments integration.
Clean implementation following Dodo webhook format and best practices.
"""

import hashlib
import hmac
from datetime import datetime, timezone
from typing import Any, Dict

from bson import ObjectId

from app.config.loggers import general_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import (
    payments_collection,
    subscriptions_collection,
    users_collection,
    webhook_events_collection,
)
from app.models.webhook_models import (
    PaymentWebhookEvent,
    PaymentWebhookType,
    PaymentWebhookResult,
)
from app.utils.email_utils import send_pro_subscription_email


class PaymentWebhookService:
    """Clean service for handling Dodo payment webhooks."""

    def __init__(self):
        self.webhook_secret = settings.DODO_WEBHOOK_SECRET
        self.handlers = {
            PaymentWebhookType.PAYMENT_SUCCEEDED: self._handle_payment_succeeded,
            PaymentWebhookType.PAYMENT_FAILED: self._handle_payment_failed,
            PaymentWebhookType.PAYMENT_PROCESSING: self._handle_payment_processing,
            PaymentWebhookType.PAYMENT_CANCELLED: self._handle_payment_cancelled,
            PaymentWebhookType.SUBSCRIPTION_ACTIVE: self._handle_subscription_active,
            PaymentWebhookType.SUBSCRIPTION_RENEWED: self._handle_subscription_renewed,
            PaymentWebhookType.SUBSCRIPTION_CANCELLED: self._handle_subscription_cancelled,
            PaymentWebhookType.SUBSCRIPTION_EXPIRED: self._handle_subscription_expired,
            PaymentWebhookType.SUBSCRIPTION_FAILED: self._handle_subscription_failed,
            PaymentWebhookType.SUBSCRIPTION_ON_HOLD: self._handle_subscription_on_hold,
            PaymentWebhookType.SUBSCRIPTION_PLAN_CHANGED: self._handle_subscription_plan_changed,
        }

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Dodo webhook signature."""
        if not self.webhook_secret:
            logger.warning("No webhook secret configured")
            return True

        try:
            if signature.startswith("sha256="):
                signature = signature[7:]

            expected = hmac.new(
                self.webhook_secret.encode("utf-8"), payload, hashlib.sha256
            ).hexdigest()

            return hmac.compare_digest(signature, expected)
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False

    async def process_webhook(
        self, webhook_data: Dict[str, Any]
    ) -> PaymentWebhookResult:
        """Process Dodo payment webhook."""
        try:
            event = PaymentWebhookEvent(**webhook_data)
            await self._store_event(event)

            handler = self.handlers.get(event.type)
            if not handler:
                return PaymentWebhookResult(
                    event_type=event.type.value,
                    status="ignored",
                    message=f"Handler not found for {event.type}",
                )

            result = await handler(event)
            logger.info(f"Webhook processed: {event.type} - {result.status}")
            return result

        except Exception as e:
            logger.error(f"Webhook processing failed: {e}")
            return PaymentWebhookResult(
                event_type=webhook_data.get("type", "unknown"),
                status="failed",
                message=f"Processing error: {str(e)}",
            )

    # Payment event handlers
    async def _handle_payment_succeeded(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle successful payment."""
        payment_data = event.get_payment_data()
        if not payment_data:
            raise ValueError("Invalid payment data")

        payment_doc = {
            "dodo_payment_id": payment_data.payment_id,
            "dodo_subscription_id": payment_data.subscription_id,
            "business_id": payment_data.business_id,
            "customer_email": payment_data.customer.email,
            "customer_id": payment_data.customer.customer_id,
            "total_amount": payment_data.total_amount,
            "settlement_amount": payment_data.settlement_amount,
            "currency": payment_data.currency,
            "settlement_currency": payment_data.settlement_currency,
            "status": payment_data.status,
            "payment_method": payment_data.payment_method,
            "created_at": datetime.now(timezone.utc),
            "webhook_processed_at": datetime.now(timezone.utc),
            "metadata": payment_data.metadata,
        }

        await payments_collection.insert_one(payment_doc)

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Payment recorded successfully",
            payment_id=payment_data.payment_id,
            subscription_id=payment_data.subscription_id,
        )

    async def _handle_payment_failed(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle failed payment."""
        payment_data = event.get_payment_data()
        if not payment_data:
            raise ValueError("Invalid payment data")

        payment_doc = {
            "dodo_payment_id": payment_data.payment_id,
            "dodo_subscription_id": payment_data.subscription_id,
            "business_id": payment_data.business_id,
            "customer_email": payment_data.customer.email,
            "customer_id": payment_data.customer.customer_id,
            "total_amount": payment_data.total_amount,
            "currency": payment_data.currency,
            "status": "failed",
            "payment_method": payment_data.payment_method,
            "error_code": payment_data.error_code,
            "error_message": payment_data.error_message,
            "created_at": datetime.now(timezone.utc),
            "webhook_processed_at": datetime.now(timezone.utc),
            "metadata": payment_data.metadata,
        }

        await payments_collection.insert_one(payment_doc)

        if payment_data.subscription_id:
            await subscriptions_collection.update_one(
                {"dodo_subscription_id": payment_data.subscription_id},
                {
                    "$set": {
                        "status": "payment_failed",
                        "updated_at": datetime.now(timezone.utc),
                        "webhook_processed_at": datetime.now(timezone.utc),
                    }
                },
            )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Payment failure recorded",
            payment_id=payment_data.payment_id,
            subscription_id=payment_data.subscription_id,
        )

    async def _handle_payment_processing(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle payment processing status."""
        payment_data = event.get_payment_data()
        if not payment_data:
            raise ValueError("Invalid payment data")

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Payment processing status noted",
            payment_id=payment_data.payment_id,
            subscription_id=payment_data.subscription_id,
        )

    async def _handle_payment_cancelled(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle cancelled payment."""
        payment_data = event.get_payment_data()
        if not payment_data:
            raise ValueError("Invalid payment data")

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Payment cancellation noted",
            payment_id=payment_data.payment_id,
            subscription_id=payment_data.subscription_id,
        )

    # Subscription event handlers
    async def _handle_subscription_active(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription becoming active."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        result = await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "status": "active",
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                    "next_billing_date": sub_data.next_billing_date,
                    "previous_billing_date": sub_data.previous_billing_date,
                }
            },
        )

        if result.modified_count == 0:
            logger.warning(f"Subscription not found: {sub_data.subscription_id}")
            return PaymentWebhookResult(
                event_type=event.type.value,
                status="ignored",
                message="Subscription not found",
                subscription_id=sub_data.subscription_id,
            )

        await self._send_welcome_email(sub_data)

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription activated",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_renewed(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription renewal."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "status": "active",
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                    "next_billing_date": sub_data.next_billing_date,
                    "previous_billing_date": sub_data.previous_billing_date,
                }
            },
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription renewed",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_cancelled(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription cancellation."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        update_data = {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc),
            "webhook_processed_at": datetime.now(timezone.utc),
        }

        if sub_data.cancelled_at:
            update_data["cancelled_at"] = sub_data.cancelled_at

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {"$set": update_data},
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription cancelled",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_expired(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription expiration."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "status": "expired",
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                }
            },
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription expired",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_failed(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription failure."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                }
            },
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription failed",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_on_hold(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription on hold."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "status": "on_hold",
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                }
            },
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription on hold",
            subscription_id=sub_data.subscription_id,
        )

    async def _handle_subscription_plan_changed(
        self, event: PaymentWebhookEvent
    ) -> PaymentWebhookResult:
        """Handle subscription plan change."""
        sub_data = event.get_subscription_data()
        if not sub_data:
            raise ValueError("Invalid subscription data")

        await subscriptions_collection.update_one(
            {"dodo_subscription_id": sub_data.subscription_id},
            {
                "$set": {
                    "product_id": sub_data.product_id,
                    "quantity": sub_data.quantity,
                    "recurring_pre_tax_amount": sub_data.recurring_pre_tax_amount,
                    "updated_at": datetime.now(timezone.utc),
                    "webhook_processed_at": datetime.now(timezone.utc),
                }
            },
        )

        return PaymentWebhookResult(
            event_type=event.type.value,
            status="processed",
            message="Subscription plan changed",
            subscription_id=sub_data.subscription_id,
        )

    # Helper methods
    async def _send_welcome_email(self, sub_data) -> None:
        """Send welcome email for new subscription."""
        try:
            subscription = await subscriptions_collection.find_one(
                {"dodo_subscription_id": sub_data.subscription_id}
            )

            if not subscription:
                logger.warning(
                    f"Cannot send welcome email - subscription not found: {sub_data.subscription_id}"
                )
                return

            user = await users_collection.find_one(
                {"_id": ObjectId(subscription["user_id"])}
            )

            if not user or not user.get("email"):
                logger.warning(
                    f"Cannot send welcome email - user not found: {subscription.get('user_id')}"
                )
                return

            await send_pro_subscription_email(
                user_name=user.get("first_name", "User"), user_email=user["email"]
            )

        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")

    async def _store_event(self, event: PaymentWebhookEvent) -> None:
        """Store webhook event for audit."""
        try:
            event_doc = {
                "business_id": event.business_id,
                "event_type": event.type.value,
                "timestamp": event.timestamp,
                "data": event.data,
                "processed_at": datetime.now(timezone.utc),
            }

            await webhook_events_collection.insert_one(event_doc)

        except Exception as e:
            logger.error(f"Failed to store webhook event: {e}")


payment_webhook_service = PaymentWebhookService()
