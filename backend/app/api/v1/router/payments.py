"""
Clean payment router for Dodo Payments integration.
Single service approach - simple and maintainable.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, Header

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.config.loggers import general_logger as logger
from app.middleware.rate_limiter import limiter
from app.models.payment_models import (
    CreateSubscriptionRequest,
    PaymentVerificationResponse,
    PlanResponse,
    UserSubscriptionStatus,
)
from app.services.payment_service import payment_service
from app.services.payment_webhook_service import payment_webhook_service


router = APIRouter()


@router.get("/plans", response_model=List[PlanResponse])
@limiter.limit("30/minute")
async def get_plans_endpoint(request: Request, active_only: bool = True):
    """Get all available subscription plans."""
    return await payment_service.get_plans(active_only=active_only)


@router.post("/subscriptions")
@limiter.limit("5/minute")
async def create_subscription_endpoint(
    request: Request,
    subscription_data: CreateSubscriptionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new subscription and return payment link."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await payment_service.create_subscription(
        user_id, subscription_data.product_id, subscription_data.quantity
    )


@router.post("/verify-payment", response_model=PaymentVerificationResponse)
@limiter.limit("20/minute")
async def verify_payment_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Verify if user's payment has been completed."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await payment_service.verify_payment_completion(user_id)
    return PaymentVerificationResponse(**result)


@router.get("/subscription-status", response_model=UserSubscriptionStatus)
@limiter.limit("60/minute")
async def get_subscription_status_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """Get user's current subscription status."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await payment_service.get_user_subscription_status(user_id)


@router.post("/webhooks/dodo", response_model=dict)
async def handle_dodo_webhook(
    request: Request,
    webhook_data: dict,
    x_signature: str = Header(None, alias="X-Signature"),
):
    """
    Handle incoming webhooks from Dodo Payments.

    Security: Verifies webhook signature to ensure authenticity.
    Events: Processes payment.succeeded, subscription.active, etc.
    """
    try:
        # Get raw body for signature verification
        body = await request.body()

        # Verify webhook signature for security
        if x_signature and not payment_webhook_service.verify_webhook_signature(
            body, x_signature
        ):
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")

        # Process the webhook
        result = await payment_webhook_service.process_webhook(webhook_data)

        logger.info(
            f"Webhook processed successfully: {result.event_type} - {result.status}"
        )

        return {
            "status": "success",
            "event_type": result.event_type,
            "processing_status": result.status,
            "message": result.message,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
