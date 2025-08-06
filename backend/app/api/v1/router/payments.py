"""
Clean payment router for Dodo Payments integration.
Single service approach - simple and maintainable.
"""

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

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


@router.post("/webhooks/dodo")
async def handle_dodo_webhook(request: Request):
    """Handle incoming webhooks from Dodo Payments."""
    try:
        body = await request.body()
        webhook_data = json.loads(body.decode("utf-8"))

        result = await payment_service.handle_webhook(webhook_data)

        logger.info(f"Webhook processed: {result}")
        return {"status": "success", "result": result}

    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
