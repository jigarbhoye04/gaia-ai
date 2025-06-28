"""
Payment and subscription service for Razorpay integration.
"""

import hashlib
import hmac
from datetime import datetime, timedelta
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
    PlanType,
    SubscriptionDB,
    SubscriptionResponse,
    SubscriptionStatus,
    UpdateSubscriptionRequest,
    UserSubscriptionStatus,
    WebhookEvent,
)
from app.services.user_service import get_user_by_id


class PaymentServiceError(Exception):
    """Base exception for payment service errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class RazorpayService:
    """Service class for Razorpay payment integration."""

    def __init__(self):
        """Initialize Razorpay client."""
        try:
            # Use Razorpay credentials from settings (via Infisical)
            key_id = settings.RAZORPAY_KEY_ID
            key_secret = settings.RAZORPAY_KEY_SECRET
            
            # Initialize client
            self.client = razorpay.Client(auth=(key_id, key_secret))
            
            # Auto-detect test mode based on key prefix
            self.is_test_mode = key_id.startswith("rzp_test_")
            mode = "test" if self.is_test_mode else "live"
            logger.info(f"Razorpay client initialized in {mode} mode")
        except Exception as e:
            logger.error(f"Failed to initialize Razorpay client: {e}")
            raise PaymentServiceError("Failed to initialize payment service", 502)

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Verify Razorpay webhook signature."""
        try:
            # Use webhook secret from settings
            key_secret = settings.RAZORPAY_KEY_SECRET
            expected_signature = hmac.new(
                key_secret.encode(), payload, hashlib.sha256
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

    def verify_subscription_signature(
        self, razorpay_payment_id: str, razorpay_subscription_id: str, razorpay_signature: str
    ) -> bool:
        """Verify subscription payment signature for security."""
        try:
            body = f"{razorpay_payment_id}|{razorpay_subscription_id}"
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(expected_signature, razorpay_signature)
        except Exception as e:
            logger.error(f"Error verifying subscription signature: {e}")
            return False


# Initialize Razorpay service
razorpay_service = RazorpayService()


async def create_plan(plan_data: CreatePlanRequest) -> PlanResponse:
    """Create a new subscription plan."""
    try:
        # Prepare Razorpay plan data
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

        # Create plan in Razorpay
        try:
            razorpay_plan = razorpay_service.client.plan.create(razorpay_plan_data)
            mode = "test" if razorpay_service.is_test_mode else "live"
            logger.info(f"Created Razorpay plan in {mode} mode: {razorpay_plan['id']}")
        except Exception as e:
            logger.error(f"Failed to create Razorpay plan: {e}")
            raise HTTPException(status_code=502, detail="Failed to create plan in payment gateway")

        # Store plan in database
        try:
            plan_doc = PlanDB(
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

            result = await plans_collection.insert_one(plan_doc.dict(exclude={"id"}))
            plan_doc.id = str(result.inserted_id)
            
            if not result.inserted_id:
                raise HTTPException(status_code=500, detail="Failed to store plan in database")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store plan in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to save plan")

        logger.info(f"Successfully created plan: {plan_doc.name} (ID: {plan_doc.id})")

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to create plan")


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
        logger.error(f"Failed to fetch plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plans")


async def get_plan_by_id(plan_id: str) -> Optional[PlanResponse]:
    """Get a specific plan by ID."""
    try:
        if not ObjectId.is_valid(plan_id):
            raise HTTPException(status_code=400, detail="Invalid plan ID format")
            
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plan")


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
        existing_sub = await subscriptions_collection.find_one({
            "user_id": user_id,
            "status": {"$in": ["active", "authenticated"]},
        })
        
        if existing_sub:
            raise HTTPException(status_code=409, detail="User already has an active subscription")

        # Clean up old failed/abandoned subscriptions
        try:
            cleanup_result = await subscriptions_collection.delete_many({
                "user_id": user_id,
                "$or": [
                    {
                        "status": "created",
                        "created_at": {"$lt": datetime.utcnow() - timedelta(hours=1)},
                    },
                    {"status": "failed"},
                ],
            })
            
            if cleanup_result.deleted_count > 0:
                logger.info(f"Cleaned up {cleanup_result.deleted_count} failed subscriptions for user {user_id}")
        except Exception as e:
            logger.warning(f"Failed to cleanup subscriptions for user {user_id}: {e}")

        # Get Razorpay plan ID
        razorpay_plan_id = await get_razorpay_plan_id(subscription_data.plan_id)
        
        # Create subscription in Razorpay
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
            razorpay_subscription = razorpay_service.client.subscription.create(razorpay_sub_data)
            mode = "test" if razorpay_service.is_test_mode else "live"
            logger.info(f"Created Razorpay subscription in {mode} mode: {razorpay_subscription['id']}")
        except Exception as e:
            logger.error(f"Failed to create Razorpay subscription: {e}")
            raise HTTPException(status_code=502, detail="Failed to create subscription in payment gateway")

        # Store subscription in database
        try:
            current_time = datetime.utcnow()
            subscription_doc = SubscriptionDB(
                razorpay_subscription_id=razorpay_subscription["id"],
                user_id=user_id,
                plan_id=subscription_data.plan_id,
                status=razorpay_subscription["status"],
                quantity=subscription_data.quantity,
                current_start=_timestamp_to_datetime(razorpay_subscription.get("current_start")),
                current_end=_timestamp_to_datetime(razorpay_subscription.get("current_end")),
                ended_at=None,
                charge_at=_timestamp_to_datetime(razorpay_subscription.get("charge_at")),
                start_at=_timestamp_to_datetime(razorpay_subscription.get("start_at")),
                end_at=_timestamp_to_datetime(razorpay_subscription.get("end_at")),
                auth_attempts=razorpay_subscription.get("auth_attempts", 0),
                total_count=razorpay_subscription.get("total_count", 100),
                paid_count=razorpay_subscription.get("paid_count", 0),
                customer_notify=subscription_data.customer_notify,
                notes=subscription_data.notes or {},
                created_at=current_time,
                updated_at=current_time,
            )

            result = await subscriptions_collection.insert_one(
                subscription_doc.dict(by_alias=True, exclude={"id"})
            )
            subscription_doc.id = str(result.inserted_id)
            
            if not result.inserted_id:
                raise HTTPException(status_code=500, detail="Failed to store subscription in database")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store subscription in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to save subscription")

        logger.info(f"Successfully created subscription for user {user_id}: {subscription_doc.id}")

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


async def create_payment(user_id: str, payment_data: CreatePaymentRequest) -> Dict[str, str]:
    """Create a payment order for one-time payments."""
    try:
        # Validate user exists
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

        try:
            razorpay_order = razorpay_service.client.order.create(order_data)
            mode = "test" if razorpay_service.is_test_mode else "live"
            logger.info(f"Created Razorpay order in {mode} mode: {razorpay_order['id']}")
        except Exception as e:
            logger.error(f"Failed to create Razorpay order: {e}")
            raise HTTPException(status_code=502, detail="Failed to create order in payment gateway")

        logger.info(f"Created payment order for user {user_id}: {razorpay_order['id']}")

        return {
            "order_id": razorpay_order["id"],
            "amount": str(razorpay_order["amount"]),
            "currency": razorpay_order["currency"],
            "key": settings.RAZORPAY_KEY_ID,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment")


async def verify_payment(
    user_id: str, callback_data: PaymentCallbackRequest
) -> PaymentResponse:
    """Verify and process payment callback."""
    try:
        # Verify payment signature
        if callback_data.razorpay_order_id:
            # Regular payment verification
            is_valid = razorpay_service.verify_payment_signature(
                callback_data.razorpay_order_id,
                callback_data.razorpay_payment_id,
                callback_data.razorpay_signature,
            )
            logger.info(f"Regular payment signature verification: {is_valid}")
        elif callback_data.razorpay_subscription_id:
            # Subscription payment verification
            is_valid = razorpay_service.verify_subscription_signature(
                callback_data.razorpay_payment_id,
                callback_data.razorpay_subscription_id,
                callback_data.razorpay_signature,
            )
            logger.info(f"Subscription payment signature verification: {is_valid}")
        else:
            logger.error("No order_id or subscription_id provided for signature verification")
            raise HTTPException(status_code=400, detail="Missing order_id or subscription_id for verification")
        
        if not is_valid:
            logger.error(f"Invalid payment signature for payment_id: {callback_data.razorpay_payment_id}")
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        mode = "test" if razorpay_service.is_test_mode else "live"
        logger.info(f"Payment signature verified successfully in {mode} mode")

        # Fetch payment details from Razorpay
        try:
            razorpay_payment = razorpay_service.client.payment.fetch(callback_data.razorpay_payment_id)
            logger.info(f"Fetched payment data in {mode} mode: {callback_data.razorpay_payment_id}")
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {e}")
            raise HTTPException(status_code=502, detail="Failed to fetch payment details")

        # Store payment in database
        try:
            # Determine payment method
            payment_method = None
            if razorpay_payment.get("method"):
                try:
                    payment_method = PaymentMethod(razorpay_payment["method"])
                except ValueError:
                    payment_method = None

            current_time = datetime.utcnow()
            payment_doc = PaymentDB(
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
                notes=razorpay_payment.get("notes", {}) if isinstance(razorpay_payment.get("notes", {}), dict) else {},
                created_at=current_time,
            )

            result = await payments_collection.insert_one(
                payment_doc.dict(by_alias=True, exclude={"id"})
            )
            payment_doc.id = str(result.inserted_id)
            
            if not result.inserted_id:
                raise HTTPException(status_code=500, detail="Failed to store payment in database")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store payment in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to save payment")

        # If this payment is for a subscription, activate the subscription
        if callback_data.razorpay_subscription_id:
            try:
                result = await subscriptions_collection.update_one(
                    {"razorpay_subscription_id": callback_data.razorpay_subscription_id},
                    {
                        "$set": {
                            "status": "active",
                            "paid_count": 1,
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )
                
                if result.modified_count > 0:
                    logger.info(f"Activated subscription: {callback_data.razorpay_subscription_id}")
                else:
                    logger.warning(f"No subscription found to activate: {callback_data.razorpay_subscription_id}")
            except Exception as e:
                logger.error(f"Failed to activate subscription {callback_data.razorpay_subscription_id}: {e}")
                # Don't fail the payment verification for subscription activation issues

        logger.info(f"Successfully verified and stored payment: {payment_doc.id}")

        return PaymentResponse(
            id=payment_doc.id,
            user_id=payment_doc.user_id,
            subscription_id=payment_doc.subscription_id,
            order_id=payment_doc.order_id,
            amount=payment_doc.amount,
            currency=payment_doc.currency,
            status=PaymentStatus(payment_doc.status),
            method=payment_method,
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
        logger.error(f"Unexpected error verifying payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify payment")


def _timestamp_to_datetime(timestamp: Optional[int]) -> Optional[datetime]:
    """Convert Unix timestamp to datetime."""
    return datetime.fromtimestamp(timestamp) if timestamp else None


async def get_razorpay_plan_id(plan_id: str) -> str:
    """Get Razorpay plan ID from our plan ID."""
    try:
        plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        logger.info(f"{plan["razorpay_plan_id"]=}")
        return plan["razorpay_plan_id"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get Razorpay plan ID for {plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plan details")


# Core subscription management functions
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
                status=SubscriptionStatus.CANCELLED
            )
        
        # Get plan details
        plan = await plans_collection.find_one({"_id": ObjectId(subscription["plan_id"])})
        plan_type = PlanType.FREE
        
        if plan:
            plan_name = plan.get("name", "").lower()
            if "basic" in plan_name:
                plan_type = PlanType.BASIC
            elif "pro" in plan_name:
                plan_type = PlanType.PRO
            elif "enterprise" in plan_name:
                plan_type = PlanType.ENTERPRISE
        
        # Calculate days remaining
        days_remaining = None
        if subscription.get("current_end"):
            remaining_delta = subscription["current_end"] - datetime.utcnow()
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
                "is_active": plan.get("is_active", True)
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
            "updated_at": subscription.get("updated_at")
        }
        
        return UserSubscriptionStatus(
            user_id=user_id,
            current_plan=current_plan,
            subscription=subscription_data,
            is_subscribed=True,
            days_remaining=days_remaining,
            can_upgrade=plan_type != PlanType.ENTERPRISE,
            can_downgrade=plan_type not in [PlanType.FREE, PlanType.BASIC],
            # Legacy fields for backward compatibility
            has_subscription=True,
            plan_type=plan_type,
            status=SubscriptionStatus(subscription["status"]),
            current_period_start=subscription.get("current_start"),
            current_period_end=subscription.get("current_end"),
            cancel_at_period_end=subscription.get("cancel_at_cycle_end", False),
            trial_end=subscription.get("trial_end"),
            subscription_id=subscription.get("razorpay_subscription_id"),
            plan_id=subscription["plan_id"]
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
        update_data = {}
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
            raise HTTPException(status_code=502, detail="Failed to update subscription in payment gateway")
        
        # Update subscription in database
        db_update_data = {
            "updated_at": datetime.utcnow(),
        }
        
        if subscription_data.plan_id:
            db_update_data["plan_id"] = subscription_data.plan_id
        
        if subscription_data.quantity is not None:
            db_update_data["quantity"] = subscription_data.quantity
        
        result = await subscriptions_collection.update_one(
            {"_id": ObjectId(current_subscription["_id"])},
            {"$set": db_update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"No subscription updated in database for user {user_id}")
        
        # Fetch updated subscription
        updated_subscription_doc = await subscriptions_collection.find_one(
            {"_id": ObjectId(current_subscription["_id"])}
        )
        
        return SubscriptionResponse(
            id=str(updated_subscription_doc["_id"]),
            razorpay_subscription_id=updated_subscription_doc["razorpay_subscription_id"],
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
            notes=updated_subscription_doc.get("notes", {})
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
                    razorpay_subscription_id,
                    {"cancel_at_cycle_end": True}
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
            raise HTTPException(status_code=502, detail="Failed to cancel subscription in payment gateway")
        
        # Update subscription in database
        update_data = {
            "status": new_status,
            "cancel_at_cycle_end": cancel_at_cycle_end,
            "updated_at": datetime.utcnow(),
        }
        
        if not cancel_at_cycle_end:
            update_data["ended_at"] = datetime.utcnow()
        
        result = await subscriptions_collection.update_one(
            {"_id": ObjectId(subscription["_id"])},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            logger.warning(f"No subscription updated in database for user {user_id}")
        
        return {
            "message": "Subscription cancelled successfully",
            "cancel_at_cycle_end": str(cancel_at_cycle_end),
            "status": new_status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error cancelling subscription for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


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


async def _process_payment_webhook(event_type: str, payment_entity: Dict[str, Any]) -> Dict[str, str]:
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
                    "updated_at": datetime.utcnow(),
                }
            }
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
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        logger.info(f"Payment failed: {payment_id}")
    
    return {"status": "processed", "event": event_type, "payment_id": payment_id}


async def _process_subscription_webhook(event_type: str, subscription_entity: Dict[str, Any]) -> Dict[str, str]:
    """Process subscription-related webhook events."""
    subscription_id = subscription_entity.get("id")
    
    if event_type == "subscription.activated":
        # Activate subscription
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$set": {
                    "status": "active",
                    "current_start": _timestamp_to_datetime(subscription_entity.get("current_start")),
                    "current_end": _timestamp_to_datetime(subscription_entity.get("current_end")),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        logger.info(f"Subscription activated: {subscription_id}")
    
    elif event_type == "subscription.charged":
        # Update subscription payment count
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$inc": {"paid_count": 1},
                "$set": {
                    "current_start": _timestamp_to_datetime(subscription_entity.get("current_start")),
                    "current_end": _timestamp_to_datetime(subscription_entity.get("current_end")),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        logger.info(f"Subscription charged: {subscription_id}")
    
    elif event_type == "subscription.cancelled":
        # Cancel subscription
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$set": {
                    "status": "cancelled",
                    "ended_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        logger.info(f"Subscription cancelled: {subscription_id}")
    
    elif event_type == "subscription.completed":
        # Complete subscription
        await subscriptions_collection.update_one(
            {"razorpay_subscription_id": subscription_id},
            {
                "$set": {
                    "status": "completed",
                    "ended_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        logger.info(f"Subscription completed: {subscription_id}")
    
    return {"status": "processed", "event": event_type, "subscription_id": subscription_id}