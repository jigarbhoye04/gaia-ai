"""
Payment and subscription router for Razorpay integration.
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import general_logger as logger
from app.models.payment_models import (
    CreatePaymentRequest,
    CreatePlanRequest,
    CreateSubscriptionRequest,
    PaymentCallbackRequest,
    PaymentResponse,
    PlanResponse,
    SubscriptionResponse,
    UpdateSubscriptionRequest,
    UserSubscriptionStatus,
    WebhookEvent,
)
from app.services.payment_service import (
    cancel_subscription,
    create_payment,
    create_plan,
    create_subscription,
    get_plan_by_id,
    get_plans,
    get_user_subscription_status,
    process_webhook,
    razorpay_service,
    update_subscription,
    verify_payment,
)

router = APIRouter()
security = HTTPBearer()


# Plan Management Endpoints
@router.post(
    "/plans", response_model=PlanResponse, summary="Create a new subscription plan"
)
async def create_plan_endpoint(
    plan_data: CreatePlanRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new subscription plan.

    Only admin users should be able to create plans.
    """
    # Here you might want to add admin check
    # if not current_user.get("is_admin", False):
    #     raise HTTPException(status_code=403, detail="Admin access required")

    return await create_plan(plan_data)


@router.get(
    "/plans", response_model=List[PlanResponse], summary="Get all subscription plans"
)
async def get_plans_endpoint(active_only: bool = True):
    """
    Get all available subscription plans.

    Args:
        active_only: If True, only return active plans
    """
    return await get_plans(active_only=active_only)


@router.get(
    "/plans/{plan_id}", response_model=PlanResponse, summary="Get a specific plan"
)
async def get_plan_endpoint(plan_id: str):
    """
    Get details of a specific subscription plan.

    Args:
        plan_id: The ID of the plan to retrieve
    """
    plan = await get_plan_by_id(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# Subscription Management Endpoints
@router.post(
    "/subscriptions",
    response_model=SubscriptionResponse,
    summary="Create a new subscription",
)
async def create_subscription_endpoint(
    subscription_data: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new subscription for the authenticated user.

    Args:
        subscription_data: Subscription creation details
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await create_subscription(user_id, subscription_data)


@router.get(
    "/subscriptions/status",
    response_model=UserSubscriptionStatus,
    summary="Get user subscription status",
)
async def get_subscription_status_endpoint(
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current subscription status for the authenticated user.
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await get_user_subscription_status(user_id)


@router.put(
    "/subscriptions", response_model=SubscriptionResponse, summary="Update subscription"
)
async def update_subscription_endpoint(
    subscription_data: UpdateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the user's current subscription.

    Args:
        subscription_data: Subscription update details
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await update_subscription(user_id, subscription_data)


@router.delete("/subscriptions", summary="Cancel subscription")
async def cancel_subscription_endpoint(
    cancel_at_cycle_end: bool = True,
    current_user: dict = Depends(get_current_user),
):
    """
    Cancel the user's current subscription.

    Args:
        cancel_at_cycle_end: If True, cancel at the end of current billing cycle
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await cancel_subscription(user_id, cancel_at_cycle_end)


# Payment Endpoints
@router.post("/payments/create", summary="Create a payment order")
async def create_payment_endpoint(
    payment_data: CreatePaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a payment order for one-time payments.

    Args:
        payment_data: Payment creation details
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await create_payment(user_id, payment_data)


@router.post(
    "/payments/verify", response_model=PaymentResponse, summary="Verify payment"
)
async def verify_payment_endpoint(
    callback_data: PaymentCallbackRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Verify a payment after user completes the payment process.

    Args:
        callback_data: Payment callback data from Razorpay
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication required")

    return await verify_payment(user_id, callback_data)


# Webhook Endpoint
@router.post("/webhooks/razorpay", summary="Handle Razorpay webhooks")
async def razorpay_webhook_endpoint(request: Request):
    """
    Handle incoming webhooks from Razorpay.

    This endpoint processes various payment and subscription events.
    """
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


# Utility Endpoints
@router.get("/config", summary="Get payment configuration")
async def get_payment_config():
    """
    Get payment configuration for frontend integration.

    Returns public configuration like Razorpay key ID.
    """
    from app.config.settings import settings

    return {
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "currency": "INR",
        "company_name": "GAIA",
        "company_logo": f"{settings.FRONTEND_URL}/logo.png",
        "theme_color": "#3399cc",
    }


@router.get("/health", summary="Payment service health check")
async def payment_health_check():
    """
    Health check endpoint for payment service.
    """
    try:
        # Test Razorpay connection
        razorpay_service.client.payment.all({"count": 1})
        return {
            "status": "healthy",
            "razorpay_connection": "active",
            "timestamp": str(datetime.utcnow()),
        }
    except Exception as e:
        logger.error(f"Payment service health check failed: {e}")
        return {
            "status": "unhealthy",
            "razorpay_connection": "failed",
            "error": str(e),
            "timestamp": str(datetime.utcnow()),
        }
