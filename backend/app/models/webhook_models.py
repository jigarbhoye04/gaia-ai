"""
Webhook event tracking for idempotency.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class WebhookEventDB(BaseModel):
    """Database model for tracking processed webhook events."""

    id: Optional[str] = Field(None, alias="_id")
    event_id: str
    event_type: str
    razorpay_entity_id: str  # subscription_id or payment_id
    processed_at: datetime
    payload_hash: str  # SHA256 hash of payload for deduplication
    status: str  # "processed", "failed", "retrying"
    retry_count: int = 0
    error_message: Optional[str] = None

    class Config:
        allow_population_by_field_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
