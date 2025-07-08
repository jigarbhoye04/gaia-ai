"""
Payment and subscription related models for Razorpay integration.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PlanType(str, Enum):
    """Subscription plan types."""

    FREE = "free"
    PRO = "pro"


class PlanDuration(str, Enum):
    """Plan billing duration."""

    MONTHLY = "monthly"
    YEARLY = "yearly"


class PaymentStatus(str, Enum):
    """Payment status."""

    PENDING = "pending"
    AUTHORIZED = "authorized"
    PAID = "paid"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class SubscriptionStatus(str, Enum):
    """Subscription status."""

    CREATED = "created"
    AUTHENTICATED = "authenticated"
    ACTIVE = "active"
    PAUSED = "paused"
    HALTED = "halted"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    EXPIRED = "expired"


class PaymentMethod(str, Enum):
    """Payment methods."""

    CARD = "card"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    UPI = "upi"
    EMI = "emi"


class Currency(str, Enum):
    """Supported currencies."""

    INR = "INR"
    USD = "USD"


# Request Models
class CreatePlanRequest(BaseModel):
    """Request model for creating a subscription plan."""

    name: str = Field(..., description="Name of the plan")
    description: Optional[str] = Field(None, description="Plan description")
    amount: int = Field(..., description="Plan amount in smallest currency unit")
    currency: Currency = Field(Currency.USD, description="Currency")
    duration: PlanDuration = Field(..., description="Billing duration")
    max_users: Optional[int] = Field(None, description="Maximum users allowed")
    features: List[str] = Field(default_factory=list, description="List of features")
    is_active: bool = Field(True, description="Whether the plan is active")


class CreateSubscriptionRequest(BaseModel):
    """Request model for creating a subscription."""

    plan_id: str = Field(..., description="Plan ID to subscribe to")
    quantity: int = Field(1, description="Quantity of subscriptions")
    customer_notify: bool = Field(True, description="Whether to notify customer")
    addons: Optional[List[Dict[str, Any]]] = Field(
        default_factory=list, description="Add-ons"
    )
    notes: Optional[Dict[str, str]] = Field(default_factory=dict, description="Notes")


class CreatePaymentRequest(BaseModel):
    """Request model for creating a payment."""

    amount: int = Field(..., description="Amount in smallest currency unit")
    currency: Currency = Field(Currency.USD, description="Currency")
    description: Optional[str] = Field(None, description="Payment description")
    notes: Optional[Dict[str, str]] = Field(default_factory=dict, description="Notes")


class PaymentCallbackRequest(BaseModel):
    """Request model for payment callback/webhook."""

    razorpay_payment_id: str = Field(..., description="Razorpay payment ID")
    razorpay_order_id: Optional[str] = Field(None, description="Razorpay order ID")
    razorpay_subscription_id: Optional[str] = Field(
        None, description="Razorpay subscription ID"
    )
    razorpay_signature: str = Field(
        ..., description="Razorpay signature for verification"
    )


class UpdateSubscriptionRequest(BaseModel):
    """Request model for updating subscription."""

    plan_id: Optional[str] = Field(None, description="New plan ID")
    quantity: Optional[int] = Field(None, description="New quantity")
    remaining_count: Optional[int] = Field(None, description="Remaining billing cycles")
    replace_items: Optional[bool] = Field(False, description="Replace all items")
    prorate: Optional[bool] = Field(True, description="Prorate the subscription")


# Response Models
class PlanResponse(BaseModel):
    """Response model for subscription plan."""

    id: str = Field(..., description="Plan ID")
    name: str = Field(..., description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    amount: int = Field(..., description="Plan amount")
    currency: str = Field(..., description="Currency")
    duration: str = Field(..., description="Billing duration")
    max_users: Optional[int] = Field(None, description="Maximum users")
    features: List[str] = Field(default_factory=list, description="Features")
    is_active: bool = Field(..., description="Active status")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Update timestamp")


class SubscriptionResponse(BaseModel):
    """Response model for subscription."""

    id: str = Field(..., description="Subscription ID")
    razorpay_subscription_id: str = Field(..., description="Razorpay subscription ID")
    user_id: str = Field(..., description="User ID")
    plan_id: str = Field(..., description="Plan ID")
    status: SubscriptionStatus = Field(..., description="Subscription status")
    quantity: int = Field(..., description="Quantity")
    current_start: Optional[datetime] = Field(None, description="Current period start")
    current_end: Optional[datetime] = Field(None, description="Current period end")
    ended_at: Optional[datetime] = Field(None, description="Subscription end time")
    charge_at: Optional[datetime] = Field(None, description="Next charge time")
    start_at: Optional[datetime] = Field(None, description="Subscription start time")
    end_at: Optional[datetime] = Field(None, description="Subscription end time")
    auth_attempts: int = Field(0, description="Authentication attempts")
    total_count: int = Field(..., description="Total billing cycles")
    paid_count: int = Field(0, description="Paid billing cycles")
    customer_notify: bool = Field(True, description="Customer notification enabled")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Update timestamp")
    notes: Optional[Dict[str, str]] = Field(default_factory=dict, description="Notes")


class PaymentResponse(BaseModel):
    """Response model for payment."""

    id: str = Field(..., description="Payment ID")
    user_id: str = Field(..., description="User ID")
    subscription_id: Optional[str] = Field(None, description="Subscription ID")
    order_id: Optional[str] = Field(None, description="Order ID")
    amount: int = Field(..., description="Payment amount")
    currency: str = Field(..., description="Currency")
    status: PaymentStatus = Field(..., description="Payment status")
    method: Optional[PaymentMethod] = Field(None, description="Payment method")
    description: Optional[str] = Field(None, description="Payment description")
    international: bool = Field(False, description="International payment")
    refund_status: Optional[str] = Field(None, description="Refund status")
    amount_refunded: int = Field(0, description="Refunded amount")
    captured: bool = Field(False, description="Payment captured")
    email: Optional[str] = Field(None, description="Customer email")
    contact: Optional[str] = Field(None, description="Customer contact")
    fee: Optional[int] = Field(None, description="Processing fee")
    tax: Optional[int] = Field(None, description="Tax")
    error_code: Optional[str] = Field(None, description="Error code")
    error_description: Optional[str] = Field(None, description="Error description")
    created_at: datetime = Field(..., description="Creation timestamp")
    notes: Optional[Dict[str, str]] = Field(default_factory=dict, description="Notes")


class UserSubscriptionStatus(BaseModel):
    """Response model for user subscription status."""

    user_id: str = Field(..., description="User ID")
    current_plan: Optional[Dict[str, Any]] = Field(
        None, description="Current plan details"
    )
    subscription: Optional[Dict[str, Any]] = Field(
        None, description="Current subscription"
    )
    is_subscribed: bool = Field(
        False, description="Whether user has an active subscription"
    )
    days_remaining: Optional[int] = Field(
        None, description="Days remaining in current period"
    )
    can_upgrade: bool = Field(True, description="Whether user can upgrade")
    can_downgrade: bool = Field(True, description="Whether user can downgrade")

    # Legacy fields for backward compatibility
    has_subscription: Optional[bool] = Field(
        None, description="Legacy field - use is_subscribed"
    )
    plan_type: Optional[PlanType] = Field(
        None, description="Legacy field - check current_plan"
    )
    status: Optional[SubscriptionStatus] = Field(
        None, description="Legacy field - check subscription"
    )
    current_period_start: Optional[datetime] = Field(None, description="Legacy field")
    current_period_end: Optional[datetime] = Field(None, description="Legacy field")
    cancel_at_period_end: Optional[bool] = Field(None, description="Legacy field")
    trial_end: Optional[datetime] = Field(None, description="Legacy field")
    subscription_id: Optional[str] = Field(None, description="Legacy field")
    plan_id: Optional[str] = Field(None, description="Legacy field")


class PaymentHistoryResponse(BaseModel):
    """Response model for payment history."""

    payments: List[PaymentResponse] = Field(
        default_factory=list, description="Payment list"
    )
    total_count: int = Field(0, description="Total payments")
    total_amount: int = Field(0, description="Total amount paid")


class WebhookEvent(BaseModel):
    """Webhook event model."""

    entity: str = Field(..., description="Entity type")
    account_id: str = Field(..., description="Account ID")
    event: str = Field(..., description="Event type")
    created_at: int = Field(..., description="Creation timestamp")
    payload: Dict[str, Any] = Field(..., description="Event payload")


# Database Models (Internal)
class PlanDB(BaseModel):
    """Database model for subscription plan."""

    id: Optional[str] = Field(None, alias="_id")
    razorpay_plan_id: str = Field(..., description="Razorpay plan ID")
    name: str = Field(..., description="Plan name")
    description: Optional[str] = Field(None, description="Plan description")
    amount: int = Field(..., description="Plan amount")
    currency: str = Field(..., description="Currency")
    duration: str = Field(..., description="Billing duration")
    max_users: Optional[int] = Field(None, description="Maximum users")
    features: List[str] = Field(default_factory=list, description="Features")
    is_active: bool = Field(True, description="Active status")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Update timestamp"
    )


class SubscriptionDB(BaseModel):
    """Database model for subscription."""

    id: Optional[str] = Field(None, alias="_id")
    razorpay_subscription_id: str = Field(..., description="Razorpay subscription ID")
    user_id: str = Field(..., description="User ID")
    plan_id: str = Field(..., description="Plan ID")
    status: str = Field(..., description="Subscription status")
    quantity: int = Field(1, description="Quantity")
    current_start: Optional[datetime] = Field(None, description="Current period start")
    current_end: Optional[datetime] = Field(None, description="Current period end")
    ended_at: Optional[datetime] = Field(None, description="Subscription end time")
    charge_at: Optional[datetime] = Field(None, description="Next charge time")
    start_at: Optional[datetime] = Field(None, description="Subscription start time")
    end_at: Optional[datetime] = Field(None, description="Subscription end time")
    auth_attempts: int = Field(0, description="Authentication attempts")
    total_count: int = Field(..., description="Total billing cycles")
    paid_count: int = Field(0, description="Paid billing cycles")
    customer_notify: bool = Field(True, description="Customer notification")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Update timestamp"
    )
    notes: Dict[str, str] = Field(default_factory=dict, description="Notes")


class PaymentDB(BaseModel):
    """Database model for payment."""

    id: Optional[str] = Field(None, alias="_id")
    razorpay_payment_id: str = Field(..., description="Razorpay payment ID")
    user_id: str = Field(..., description="User ID")
    subscription_id: Optional[str] = Field(None, description="Subscription ID")
    order_id: Optional[str] = Field(None, description="Order ID")
    amount: int = Field(..., description="Payment amount")
    currency: str = Field(..., description="Currency")
    status: str = Field(..., description="Payment status")
    method: Optional[str] = Field(None, description="Payment method")
    description: Optional[str] = Field(None, description="Payment description")
    international: bool = Field(False, description="International payment")
    refund_status: Optional[str] = Field(None, description="Refund status")
    amount_refunded: int = Field(0, description="Refunded amount")
    captured: bool = Field(False, description="Payment captured")
    email: Optional[str] = Field(None, description="Customer email")
    contact: Optional[str] = Field(None, description="Customer contact")
    fee: Optional[int] = Field(None, description="Processing fee")
    tax: Optional[int] = Field(None, description="Tax")
    error_code: Optional[str] = Field(None, description="Error code")
    error_description: Optional[str] = Field(None, description="Error description")
    webhook_verified: bool = Field(False, description="Webhook verification status")
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    notes: Dict[str, str] = Field(default_factory=dict, description="Notes")
