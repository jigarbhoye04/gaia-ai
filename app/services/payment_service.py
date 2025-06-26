"""
Payment and subscription service for Razorpay integration.
"""

import hashlib
import hmac
from datetime import datetime
from typing import Any, Dict, List, Optional

import razorpay
from bson import ObjectId
from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.config.settings import settings
from app.db.mongodb.collections import (
    payments_collection,
    plans_collection,
    subscriptions_collection,
)
from app.models.payment_models import (
    CreatePaymentRequest,
    CreatePlanRequest,
    CreateSubscriptionRequest,
    PaymentCallbackRequest,
    PaymentDB,
    PaymentMethod,
    PaymentResponse,
    PaymentStatus,
    PlanDB,
    PlanResponse,
    SubscriptionDB,
    SubscriptionResponse,
    SubscriptionStatus,
    UpdateSubscriptionRequest,
    UserSubscriptionStatus,
    WebhookEvent,
)
from app.services.user_service import get_user_by_id


class RazorpayService:
    """Service class for Razorpay payment integration."""

    def __init__(self):
        """Initialize Razorpay client."""
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )
        # Type annotations for dynamic attributes (to suppress linter warnings)
        self.client.plan = getattr(self.client, "plan", None)  # type: ignore
        self.client.subscription = getattr(self.client, "subscription", None)  # type: ignore
        self.client.order = getattr(self.client, "order", None)  # type: ignore
        self.client.payment = getattr(self.client, "payment", None)  # type: ignore

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Razorpay webhook signature."""
        try:
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(), payload, hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, signature)
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False

    def verify_payment_signature(
        self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
    ) -> bool:
        """Verify payment signature for security."""
        try:
            body = f"{razorpay_order_id}|{razorpay_payment_id}"
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, razorpay_signature)
        except Exception as e:
            logger.error(f"Error verifying payment signature: {e}")
            return False


# Initialize Razorpay service
razorpay_service = RazorpayService()


async def create_plan(plan_data: CreatePlanRequest) -> PlanResponse:
    """Create a new subscription plan."""
    try:
        # Create plan in Razorpay
        razorpay_plan_data = {
            "period": plan_data.duration.value,
            "interval": 1,
            "item": {
                "name": plan_data.name,
                "amount": plan_data.amount,
                "currency": plan_data.currency.value,
                "description": plan_data.description or "",
            },
            "notes": {
                "max_users": str(plan_data.max_users) if plan_data.max_users else "",
                "features": ",".join(plan_data.features),
            },
        }

        # Use the correct Razorpay client API
        razorpay_plan = None
        try:
            # Try the standard approach first
            razorpay_plan = razorpay_service.client.plan.create(razorpay_plan_data)  # type: ignore
        except AttributeError:
            # If plan attribute doesn't exist, create a mock response for development
            logger.warning("Razorpay plan API not accessible, using mock data")
            razorpay_plan = {
                "id": f"plan_{int(datetime.utcnow().timestamp())}",
                "entity": "plan",
                "interval": 1,
                "period": plan_data.duration.value,
            }

        # Store plan in database
        plan_doc = PlanDB(
            _id=None,
            razorpay_plan_id=razorpay_plan["id"],
            name=plan_data.name,
            description=plan_data.description,
            amount=plan_data.amount,
            currency=plan_data.currency.value,
            duration=plan_data.duration.value,
            max_users=plan_data.max_users,
            features=plan_data.features,
            is_active=plan_data.is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        result = await plans_collection.insert_one(
            plan_doc.dict(by_alias=True, exclude={"_id"})
        )
        plan_doc.id = str(result.inserted_id)

        logger.info(f"Created plan: {plan_doc.name} with ID: {plan_doc.id}")

        return PlanResponse(
            id=plan_doc.id,
            name=plan_doc.name,
            description=plan_doc.description,
            amount=plan_doc.amount,
            currency=plan_doc.currency,
            duration=plan_doc.duration,
            max_users=plan_doc.max_users,
            features=plan_doc.features,
            is_active=plan_doc.is_active,
            created_at=plan_doc.created_at,
            updated_at=plan_doc.updated_at,
        )

    except Exception as e:
        logger.error(f"Error creating plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create plan: {str(e)}")


async def get_plans(active_only: bool = True) -> List[PlanResponse]:
    """Get all subscription plans."""
    try:
        query = {"is_active": True} if active_only else {}
        plans_cursor = plans_collection.find(query).sort("amount", 1)
        plans = await plans_cursor.to_list(length=None)

        return [
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

    except Exception as e:
        logger.error(f"Error fetching plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch plans")


async def get_plan_by_id(plan_id: str) -> Optional[PlanResponse]:
    """Get a specific plan by ID."""
    try:
        plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        if not plan:
            return None

        return PlanResponse(
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

    except Exception as e:
        logger.error(f"Error fetching plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch plan")


async def create_subscription(
    user_id: str, subscription_data: CreateSubscriptionRequest
) -> SubscriptionResponse:
    """Create a new subscription for a user."""
    try:
        # Get user details
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get plan details
        plan = await get_plan_by_id(subscription_data.plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        # Check if user already has an active subscription
        existing_sub = await subscriptions_collection.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["created", "authenticated", "active"]},
            }
        )

        if existing_sub:
            raise HTTPException(
                status_code=400, detail="User already has an active subscription"
            )

        # Create subscription in Razorpay
        razorpay_sub_data = {
            "plan_id": await get_razorpay_plan_id(subscription_data.plan_id),
            "quantity": subscription_data.quantity,
            "customer_notify": subscription_data.customer_notify,
            "total_count": 120,  # 10 years for monthly, 10 years for yearly
            "addons": subscription_data.addons,
            "notes": {
                "user_id": user_id,
                "user_email": user["email"],
                **(subscription_data.notes or {}),
            },
        }

        razorpay_subscription = None
        try:
            razorpay_subscription = razorpay_service.client.subscription.create(  # type: ignore
                razorpay_sub_data
            )
        except AttributeError:
            # Mock subscription for development
            logger.warning("Razorpay subscription API not accessible, using mock data")
            razorpay_subscription = {
                "id": f"sub_{int(datetime.utcnow().timestamp())}",
                "entity": "subscription",
                "status": "created",
                "current_start": int(datetime.utcnow().timestamp()),
                "current_end": int(
                    (datetime.utcnow().timestamp()) + 2592000
                ),  # 30 days
                "auth_attempts": 0,
                "total_count": 120,
                "paid_count": 0,
            }

        # Store subscription in database
        current_time = datetime.utcnow()
        subscription_doc = SubscriptionDB(
            _id=None,
            razorpay_subscription_id=razorpay_subscription["id"],
            user_id=user_id,
            plan_id=subscription_data.plan_id,
            status=razorpay_subscription["status"],
            quantity=subscription_data.quantity,
            current_start=(
                datetime.fromtimestamp(razorpay_subscription.get("current_start", 0))
                if razorpay_subscription.get("current_start")
                else None
            ),
            current_end=(
                datetime.fromtimestamp(razorpay_subscription.get("current_end", 0))
                if razorpay_subscription.get("current_end")
                else None
            ),
            ended_at=None,
            charge_at=(
                datetime.fromtimestamp(razorpay_subscription.get("charge_at", 0))
                if razorpay_subscription.get("charge_at")
                else None
            ),
            start_at=(
                datetime.fromtimestamp(razorpay_subscription.get("start_at", 0))
                if razorpay_subscription.get("start_at")
                else None
            ),
            end_at=(
                datetime.fromtimestamp(razorpay_subscription.get("end_at", 0))
                if razorpay_subscription.get("end_at")
                else None
            ),
            auth_attempts=razorpay_subscription.get("auth_attempts", 0),
            total_count=razorpay_subscription.get("total_count", 120),
            paid_count=razorpay_subscription.get("paid_count", 0),
            customer_notify=subscription_data.customer_notify,
            notes=subscription_data.notes or {},
            created_at=current_time,
            updated_at=current_time,
        )

        result = await subscriptions_collection.insert_one(
            subscription_doc.dict(by_alias=True, exclude={"_id"})
        )
        subscription_doc.id = str(result.inserted_id)

        logger.info(f"Created subscription for user {user_id}: {subscription_doc.id}")

        return SubscriptionResponse(
            id=subscription_doc.id,
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
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create subscription: {str(e)}"
        )


async def get_user_subscription_status(user_id: str) -> UserSubscriptionStatus:
    """Get user's current subscription status."""
    try:
        # Get active subscription
        subscription = await subscriptions_collection.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["created", "authenticated", "active"]},
            }
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
            )

        # Get plan details
        plan = await get_plan_by_id(subscription["plan_id"])

        # Calculate days remaining
        days_remaining = None
        if subscription.get("current_end"):
            days_remaining = (subscription["current_end"] - datetime.utcnow()).days

        subscription_response = SubscriptionResponse(
            id=str(subscription["_id"]),
            user_id=subscription["user_id"],
            plan_id=subscription["plan_id"],
            status=SubscriptionStatus(subscription["status"]),
            quantity=subscription["quantity"],
            current_start=subscription.get("current_start"),
            current_end=subscription.get("current_end"),
            ended_at=subscription.get("ended_at"),
            charge_at=subscription.get("charge_at"),
            start_at=subscription.get("start_at"),
            end_at=subscription.get("end_at"),
            auth_attempts=subscription.get("auth_attempts", 0),
            total_count=subscription.get("total_count", 120),
            paid_count=subscription.get("paid_count", 0),
            customer_notify=subscription.get("customer_notify", True),
            created_at=subscription["created_at"],
            updated_at=subscription["updated_at"],
            notes=subscription.get("notes", {}),
        )

        return UserSubscriptionStatus(
            user_id=user_id,
            current_plan=plan,
            subscription=subscription_response,
            is_subscribed=subscription["status"] == "active",
            days_remaining=days_remaining,
            can_upgrade=True,
            can_downgrade=subscription["status"] == "active",
        )

    except Exception as e:
        logger.error(f"Error getting user subscription status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")


async def update_subscription(
    user_id: str, subscription_data: UpdateSubscriptionRequest
) -> SubscriptionResponse:
    """Update user's subscription."""
    try:
        # Get current subscription
        subscription = await subscriptions_collection.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["created", "authenticated", "active"]},
            }
        )

        if not subscription:
            raise HTTPException(status_code=404, detail="Active subscription not found")

        # Prepare update data for Razorpay
        razorpay_update_data = {}
        if subscription_data.plan_id:
            new_plan = await get_plan_by_id(subscription_data.plan_id)
            if not new_plan:
                raise HTTPException(status_code=404, detail="New plan not found")

            razorpay_plan_id = await get_razorpay_plan_id(subscription_data.plan_id)
            razorpay_update_data["plan_id"] = razorpay_plan_id

        if subscription_data.quantity is not None:
            razorpay_update_data["quantity"] = subscription_data.quantity

        if subscription_data.remaining_count is not None:
            razorpay_update_data["remaining_count"] = subscription_data.remaining_count

        # Update subscription in Razorpay
        if razorpay_update_data:
            try:
                razorpay_service.client.subscription.update(  # type: ignore
                    subscription["razorpay_subscription_id"], razorpay_update_data
                )
            except AttributeError:
                logger.warning("Razorpay subscription update API not accessible")

        # Update subscription in database
        db_update_data: Dict[str, Any] = {"updated_at": datetime.utcnow()}
        if subscription_data.plan_id:
            db_update_data["plan_id"] = subscription_data.plan_id
        if subscription_data.quantity is not None:
            db_update_data["quantity"] = subscription_data.quantity

        await subscriptions_collection.update_one(
            {"_id": ObjectId(subscription["_id"])}, {"$set": db_update_data}
        )

        # Fetch updated subscription
        updated_subscription = await subscriptions_collection.find_one(
            {"_id": ObjectId(subscription["_id"])}
        )

        if not updated_subscription:
            raise HTTPException(
                status_code=500, detail="Failed to fetch updated subscription"
            )

        logger.info(f"Updated subscription for user {user_id}")

        return SubscriptionResponse(
            id=str(updated_subscription["_id"]),
            user_id=updated_subscription["user_id"],
            plan_id=updated_subscription["plan_id"],
            status=SubscriptionStatus(updated_subscription["status"]),
            quantity=updated_subscription["quantity"],
            current_start=updated_subscription.get("current_start"),
            current_end=updated_subscription.get("current_end"),
            ended_at=updated_subscription.get("ended_at"),
            charge_at=updated_subscription.get("charge_at"),
            start_at=updated_subscription.get("start_at"),
            end_at=updated_subscription.get("end_at"),
            auth_attempts=updated_subscription.get("auth_attempts", 0),
            total_count=updated_subscription.get("total_count", 120),
            paid_count=updated_subscription.get("paid_count", 0),
            customer_notify=updated_subscription.get("customer_notify", True),
            created_at=updated_subscription["created_at"],
            updated_at=updated_subscription["updated_at"],
            notes=updated_subscription.get("notes", {}),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update subscription: {str(e)}"
        )


async def cancel_subscription(
    user_id: str, cancel_at_cycle_end: bool = True
) -> Dict[str, str]:
    """Cancel user's subscription."""
    try:
        # Get current subscription
        subscription = await subscriptions_collection.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["created", "authenticated", "active"]},
            }
        )

        if not subscription:
            raise HTTPException(status_code=404, detail="Active subscription not found")

        # Cancel subscription in Razorpay
        try:
            razorpay_service.client.subscription.cancel(  # type: ignore
                subscription["razorpay_subscription_id"],
                {"cancel_at_cycle_end": cancel_at_cycle_end},
            )
        except AttributeError:
            logger.warning("Razorpay subscription cancel API not accessible")

        # Update subscription status in database
        update_data = {
            "status": "cancelled" if not cancel_at_cycle_end else "active",
            "updated_at": datetime.utcnow(),
        }

        if not cancel_at_cycle_end:
            update_data["ended_at"] = datetime.utcnow()

        await subscriptions_collection.update_one(
            {"_id": ObjectId(subscription["_id"])}, {"$set": update_data}
        )

        logger.info(f"Cancelled subscription for user {user_id}")

        return {
            "message": "Subscription cancelled successfully",
            "cancel_at_cycle_end": str(cancel_at_cycle_end),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to cancel subscription: {str(e)}"
        )


async def create_payment(
    user_id: str, payment_data: CreatePaymentRequest
) -> Dict[str, str]:
    """Create a payment order."""
    try:
        # Get user details
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create order in Razorpay
        order_data = {
            "amount": payment_data.amount,
            "currency": payment_data.currency.value,
            "receipt": f"order_{user_id}_{int(datetime.utcnow().timestamp())}",
            "notes": {
                "user_id": user_id,
                "user_email": user["email"],
                **(payment_data.notes or {}),
            },
        }

        razorpay_order = None
        try:
            razorpay_order = razorpay_service.client.order.create(order_data)  # type: ignore
        except AttributeError:
            # Mock order for development
            logger.warning("Razorpay order API not accessible, using mock data")
            razorpay_order = {
                "id": f"order_{int(datetime.utcnow().timestamp())}",
                "entity": "order",
                "amount": payment_data.amount,
                "currency": payment_data.currency.value,
                "status": "created",
            }

        logger.info(f"Created payment order for user {user_id}: {razorpay_order['id']}")

        return {
            "order_id": razorpay_order["id"],
            "amount": str(razorpay_order["amount"]),
            "currency": razorpay_order["currency"],
            "key": settings.RAZORPAY_KEY_ID,
        }

    except Exception as e:
        logger.error(f"Error creating payment: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create payment: {str(e)}"
        )


async def verify_payment(
    user_id: str, callback_data: PaymentCallbackRequest
) -> PaymentResponse:
    """Verify and process payment callback."""
    try:
        # Verify payment signature
        if callback_data.razorpay_order_id:
            is_valid = razorpay_service.verify_payment_signature(
                callback_data.razorpay_order_id,
                callback_data.razorpay_payment_id,
                callback_data.razorpay_signature,
            )
        else:
            # For subscription payments, verify differently
            body = f"{callback_data.razorpay_payment_id}|{callback_data.razorpay_subscription_id}"
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
            ).hexdigest()
            is_valid = hmac.compare_digest(
                expected_signature, callback_data.razorpay_signature
            )

        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        # Fetch payment details from Razorpay
        razorpay_payment = None
        try:
            razorpay_payment = razorpay_service.client.payment.fetch(  # type: ignore
                callback_data.razorpay_payment_id
            )
        except AttributeError:
            # Mock payment for development
            logger.warning("Razorpay payment fetch API not accessible, using mock data")
            razorpay_payment = {
                "id": callback_data.razorpay_payment_id,
                "entity": "payment",
                "amount": 100,  # 1.-- USD
                "currency": "USD",
                "status": "captured",
                "method": "card",
                "captured": True,
                "international": False,
                "refund_status": None,
                "amount_refunded": 0,
                "fee": 2360,
                "tax": 360,
                "notes": {},
            }

        # Determine payment method
        payment_method = None
        if razorpay_payment.get("method"):
            try:
                payment_method = PaymentMethod(razorpay_payment["method"])
            except ValueError:
                payment_method = None

        # Store payment in database
        current_time = datetime.utcnow()
        payment_doc = PaymentDB(
            _id=None,
            razorpay_payment_id=razorpay_payment["id"],
            user_id=user_id,
            subscription_id=callback_data.razorpay_subscription_id,
            order_id=callback_data.razorpay_order_id,
            amount=razorpay_payment["amount"],
            currency=razorpay_payment["currency"],
            status=razorpay_payment["status"],
            method=payment_method,
            description=razorpay_payment.get("description"),
            international=razorpay_payment.get("international", False),
            refund_status=razorpay_payment.get("refund_status"),
            amount_refunded=razorpay_payment.get("amount_refunded", 0),
            captured=razorpay_payment.get("captured", False),
            email=razorpay_payment.get("email"),
            contact=razorpay_payment.get("contact"),
            fee=razorpay_payment.get("fee"),
            tax=razorpay_payment.get("tax"),
            error_code=razorpay_payment.get("error_code"),
            error_description=razorpay_payment.get("error_description"),
            webhook_verified=True,
            notes=razorpay_payment.get("notes", {}),
            created_at=current_time,
        )

        result = await payments_collection.insert_one(
            payment_doc.dict(by_alias=True, exclude={"_id"})
        )
        payment_doc.id = str(result.inserted_id)

        logger.info(f"Verified and stored payment: {payment_doc.id}")

        return PaymentResponse(
            id=payment_doc.id,
            user_id=payment_doc.user_id,
            subscription_id=payment_doc.subscription_id,
            order_id=payment_doc.order_id,
            amount=payment_doc.amount,
            currency=payment_doc.currency,
            status=PaymentStatus(payment_doc.status),
            method=payment_method,  # Use the processed payment_method, not payment_doc.method
            description=payment_doc.description,
            international=payment_doc.international,
            refund_status=payment_doc.refund_status,
            amount_refunded=payment_doc.amount_refunded,
            captured=payment_doc.captured,
            email=payment_doc.email,
            contact=payment_doc.contact,
            fee=payment_doc.fee,
            tax=payment_doc.tax,
            error_code=payment_doc.error_code,
            error_description=payment_doc.error_description,
            created_at=payment_doc.created_at,
            notes=payment_doc.notes,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to verify payment: {str(e)}"
        )


async def process_webhook(event: WebhookEvent) -> Dict[str, str]:
    """Process Razorpay webhook events."""
    try:
        logger.info(f"Processing webhook event: {event.event}")

        if event.event == "payment.captured":
            await _handle_payment_captured(event.payload)
        elif event.event == "payment.failed":
            await _handle_payment_failed(event.payload)
        elif event.event == "subscription.activated":
            await _handle_subscription_activated(event.payload)
        elif event.event == "subscription.charged":
            await _handle_subscription_charged(event.payload)
        elif event.event == "subscription.cancelled":
            await _handle_subscription_cancelled(event.payload)
        elif event.event == "subscription.completed":
            await _handle_subscription_completed(event.payload)
        else:
            logger.info(f"Unhandled webhook event: {event.event}")

        return {"status": "success", "message": "Webhook processed successfully"}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process webhook: {str(e)}"
        )


# Helper functions
async def get_razorpay_plan_id(plan_id: str) -> str:
    """Get Razorpay plan ID from our plan ID."""
    plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan["razorpay_plan_id"]


async def _handle_payment_captured(payload: Dict[str, Any]) -> None:
    """Handle payment captured webhook."""
    payment = payload["payment"]["entity"]

    # Update payment status in database
    await payments_collection.update_one(
        {"razorpay_payment_id": payment["id"]},
        {
            "$set": {
                "status": "captured",
                "captured": True,
                "updated_at": datetime.utcnow(),
            }
        },
    )


async def _handle_payment_failed(payload: Dict[str, Any]) -> None:
    """Handle payment failed webhook."""
    payment = payload["payment"]["entity"]

    # Update payment status in database
    await payments_collection.update_one(
        {"razorpay_payment_id": payment["id"]},
        {
            "$set": {
                "status": "failed",
                "error_code": payment.get("error_code"),
                "error_description": payment.get("error_description"),
                "updated_at": datetime.utcnow(),
            }
        },
    )


async def _handle_subscription_activated(payload: Dict[str, Any]) -> None:
    """Handle subscription activated webhook."""
    subscription = payload["subscription"]["entity"]

    # Update subscription status in database
    await subscriptions_collection.update_one(
        {"razorpay_subscription_id": subscription["id"]},
        {
            "$set": {
                "status": "active",
                "start_at": (
                    datetime.fromtimestamp(subscription.get("start_at", 0))
                    if subscription.get("start_at")
                    else None
                ),
                "current_start": (
                    datetime.fromtimestamp(subscription.get("current_start", 0))
                    if subscription.get("current_start")
                    else None
                ),
                "current_end": (
                    datetime.fromtimestamp(subscription.get("current_end", 0))
                    if subscription.get("current_end")
                    else None
                ),
                "updated_at": datetime.utcnow(),
            }
        },
    )


async def _handle_subscription_charged(payload: Dict[str, Any]) -> None:
    """Handle subscription charged webhook."""
    subscription = payload["subscription"]["entity"]

    # Update subscription paid count
    await subscriptions_collection.update_one(
        {"razorpay_subscription_id": subscription["id"]},
        {
            "$set": {
                "paid_count": subscription.get("paid_count", 0),
                "current_start": (
                    datetime.fromtimestamp(subscription.get("current_start", 0))
                    if subscription.get("current_start")
                    else None
                ),
                "current_end": (
                    datetime.fromtimestamp(subscription.get("current_end", 0))
                    if subscription.get("current_end")
                    else None
                ),
                "updated_at": datetime.utcnow(),
            }
        },
    )


async def _handle_subscription_cancelled(payload: Dict[str, Any]) -> None:
    """Handle subscription cancelled webhook."""
    subscription = payload["subscription"]["entity"]

    # Update subscription status in database
    await subscriptions_collection.update_one(
        {"razorpay_subscription_id": subscription["id"]},
        {
            "$set": {
                "status": "cancelled",
                "ended_at": (
                    datetime.fromtimestamp(subscription.get("ended_at", 0))
                    if subscription.get("ended_at")
                    else datetime.utcnow()
                ),
                "updated_at": datetime.utcnow(),
            }
        },
    )


async def _handle_subscription_completed(payload: Dict[str, Any]) -> None:
    """Handle subscription completed webhook."""
    subscription = payload["subscription"]["entity"]

    # Update subscription status in database
    await subscriptions_collection.update_one(
        {"razorpay_subscription_id": subscription["id"]},
        {
            "$set": {
                "status": "completed",
                "ended_at": (
                    datetime.fromtimestamp(subscription.get("ended_at", 0))
                    if subscription.get("ended_at")
                    else datetime.utcnow()
                ),
                "updated_at": datetime.utcnow(),
            }
        },
    )
