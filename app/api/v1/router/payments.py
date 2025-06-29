"""
Clean payment and subscription router for Razorpay integration.
"""

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import general_logger as logger
from app.middleware.rate_limiter import limiter
from app.models.payment_models import (
    CreateSubscriptionRequest,
    PaymentCallbackRequest,
    PaymentResponse,
    PlanResponse,
    SubscriptionResponse,
    UpdateSubscriptionRequest,
    UserSubscriptionStatus,
    WebhookEvent,
)
from app.services.payments import (
    cancel_subscription,
    create_subscription,
    get_plans,
    get_user_subscription_status,
    process_webhook,
    razorpay_service,
    sync_subscription_from_razorpay,
    update_subscription,
    verify_payment,
)

# Initialize router
router = APIRouter()


# Core Payment Flow Endpoints
@router.get(
    "/plans", 
    response_model=List[PlanResponse], 
    summary="Get subscription plans"
)
@limiter.limit("30/minute")  # Allow 30 plan fetches per minute
async def get_plans_endpoint(request: Request, active_only: bool = True):
    """Get all available subscription plans."""
    return await get_plans(active_only=active_only)


@router.post(
    "/subscriptions",
    response_model=SubscriptionResponse,
    summary="Create subscription",
)
@limiter.limit("5/minute")  # Allow 5 subscription creations per minute
async def create_subscription_endpoint(
    request: Request,
    subscription_data: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new subscription for the authenticated user."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await create_subscription(user_id, subscription_data)


@router.get(
    "/subscriptions/status",
    response_model=UserSubscriptionStatus,
    summary="Get subscription status",
)
@limiter.limit("60/minute")  # Allow 60 status checks per minute
async def get_subscription_status_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get the current subscription status for the authenticated user."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await get_user_subscription_status(user_id)


@router.put(
    "/subscriptions", 
    response_model=SubscriptionResponse, 
    summary="Update subscription"
)
@limiter.limit("10/minute")  # Allow 10 subscription updates per minute
async def update_subscription_endpoint(
    request: Request,
    subscription_data: UpdateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update the user's current subscription."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await update_subscription(user_id, subscription_data)


@router.delete(
    "/subscriptions", 
    summary="Cancel subscription"
)
@limiter.limit("5/minute")  # Allow 5 cancellations per minute
async def cancel_subscription_endpoint(
    request: Request,
    cancel_at_cycle_end: bool = True,
    current_user: dict = Depends(get_current_user),
):
    """Cancel the user's current subscription."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await cancel_subscription(user_id, cancel_at_cycle_end)


@router.post(
    "/subscriptions/sync",
    summary="Sync subscription data from Razorpay"
)
@limiter.limit("5/minute")  # Allow 5 sync operations per minute
async def sync_subscription_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Sync subscription data from Razorpay to fix missing date fields."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Get user's current subscription
    from app.db.mongodb.collections import subscriptions_collection
    subscription = await subscriptions_collection.find_one({
        "user_id": user_id, 
        "status": {"$in": ["active", "created", "paused"]}
    })
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    razorpay_subscription_id = subscription["razorpay_subscription_id"]
    
    success = await sync_subscription_from_razorpay(razorpay_subscription_id)
    
    if success:
        return {"message": "Subscription synced successfully", "subscription_id": razorpay_subscription_id}
    else:
        raise HTTPException(status_code=500, detail="Failed to sync subscription")


@router.post(
    "/verify", 
    response_model=PaymentResponse, 
    summary="Verify payment"
)
@limiter.limit("20/minute")  # Allow 20 payment verifications per minute
async def verify_payment_endpoint(
    request: Request,
    callback_data: PaymentCallbackRequest,
    current_user: dict = Depends(get_current_user),
):
    """Verify a payment after user completes the payment process."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await verify_payment(user_id, callback_data)


# Webhook endpoint (no rate limiting for webhooks from Razorpay)
@router.post("/webhooks/razorpay", summary="Handle Razorpay webhooks")
async def razorpay_webhook_endpoint(request: Request):
    """Handle incoming webhooks from Razorpay."""
    try:
        # Get raw body and signature
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature")

        if not signature:
            raise HTTPException(status_code=400, detail="Missing signature")

        # Verify webhook signature
        if not razorpay_service.verify_webhook_signature(body, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Parse webhook data
        webhook_data = json.loads(body.decode("utf-8"))
        event = WebhookEvent(**webhook_data)

        # Process the webhook
        result = await process_webhook(event)

        logger.info(f"Webhook processed successfully: {event.event}")
        return result

    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


# Essential config endpoint
@router.get("/config", summary="Get payment configuration")
@limiter.limit("120/minute")  # Allow frequent config fetches
async def get_payment_config(request: Request):
    """Get payment configuration for frontend integration."""
    from app.config.settings import settings

    return {
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "currency": "USD",
        "company_name": "GAIA",
        "theme_color": "#00bbff",
    }

