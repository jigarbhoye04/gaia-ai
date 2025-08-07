"""
Payment webhook models for Dodo Payments integration.
Clean models based on actual Dodo webhook format.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class PaymentWebhookType(str, Enum):
    """Payment webhook event types from Dodo Payments."""

    # Payment events
    PAYMENT_SUCCEEDED = "payment.succeeded"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_PROCESSING = "payment.processing"
    PAYMENT_CANCELLED = "payment.cancelled"

    # Subscription events
    SUBSCRIPTION_ACTIVE = "subscription.active"
    SUBSCRIPTION_RENEWED = "subscription.renewed"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    SUBSCRIPTION_EXPIRED = "subscription.expired"
    SUBSCRIPTION_FAILED = "subscription.failed"
    SUBSCRIPTION_ON_HOLD = "subscription.on_hold"
    SUBSCRIPTION_PLAN_CHANGED = "subscription.plan_changed"


class DodoCustomer(BaseModel):
    """Customer data from Dodo webhook."""

    customer_id: str
    email: str
    name: str


class DodoBilling(BaseModel):
    """Billing address from Dodo webhook."""

    city: str
    country: str
    state: str
    street: str
    zipcode: str


class DodoPaymentData(BaseModel):
    """Payment data from Dodo payment webhook."""

    payment_id: str
    subscription_id: Optional[str] = None
    business_id: str
    brand_id: str
    customer: DodoCustomer
    billing: DodoBilling
    currency: str
    total_amount: int
    settlement_amount: int
    settlement_currency: str
    tax: int
    settlement_tax: int
    status: str
    payment_method: str
    card_network: Optional[str] = None
    card_type: Optional[str] = None
    card_last_four: Optional[str] = None
    card_issuing_country: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class DodoSubscriptionData(BaseModel):
    """Subscription data from Dodo subscription webhook."""

    subscription_id: str
    product_id: str
    customer: DodoCustomer
    billing: DodoBilling
    status: str
    currency: str
    quantity: int
    recurring_pre_tax_amount: int
    payment_frequency_count: int
    payment_frequency_interval: str
    subscription_period_count: int
    subscription_period_interval: str
    next_billing_date: Optional[str] = None
    previous_billing_date: Optional[str] = None
    created_at: str
    cancelled_at: Optional[str] = None
    cancel_at_next_billing_date: bool = False
    tax_inclusive: bool = False
    trial_period_days: int = 0
    on_demand: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    addons: list = Field(default_factory=list)
    discount_id: Optional[str] = None


class PaymentWebhookEvent(BaseModel):
    """Complete payment webhook event from Dodo Payments."""

    business_id: str
    type: PaymentWebhookType
    timestamp: str
    data: Dict[str, Any]

    def get_payment_data(self) -> Optional[DodoPaymentData]:
        """Extract payment data if this is a payment event."""
        if self.type.value.startswith("payment."):
            try:
                return DodoPaymentData(**self.data)
            except Exception:
                return None
        return None

    def get_subscription_data(self) -> Optional[DodoSubscriptionData]:
        """Extract subscription data if this is a subscription event."""
        if self.type.value.startswith("subscription."):
            try:
                return DodoSubscriptionData(**self.data)
            except Exception:
                return None
        return None


class PaymentWebhookResult(BaseModel):
    """Result of payment webhook processing."""

    event_type: str
    status: str  # "processed", "ignored", "failed"
    message: str
    payment_id: Optional[str] = None
    subscription_id: Optional[str] = None
    processed_at: datetime = Field(default_factory=lambda: datetime.now())
