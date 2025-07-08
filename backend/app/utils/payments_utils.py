"""
Utility functions for payment processing.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from app.config.loggers import general_logger as logger
from app.models.payment_models import PlanResponse


def safe_get_notes(notes_value: Any) -> Dict[str, str]:
    """
    Safely extract notes from Razorpay response.
    Razorpay sometimes returns notes as a list instead of dict.
    """
    if isinstance(notes_value, dict):
        return {str(k): str(v) for k, v in notes_value.items()}
    elif isinstance(notes_value, list) and len(notes_value) == 0:
        return {}
    elif notes_value is None:
        return {}
    else:
        logger.warning(
            f"Unexpected notes format from Razorpay: {type(notes_value)} - {notes_value}"
        )
        return {}


def timestamp_to_datetime(timestamp: Optional[int]) -> Optional[datetime]:
    """Convert Unix timestamp to datetime."""
    return datetime.fromtimestamp(timestamp) if timestamp else None


def calculate_subscription_dates(
    plan: PlanResponse, current_time: datetime, razorpay_subscription: Dict[str, Any]
) -> Dict[str, datetime]:
    """Calculate subscription date fields with sensible defaults."""
    # Get timestamps from Razorpay (may be null for new subscriptions)
    razorpay_current_start = timestamp_to_datetime(
        razorpay_subscription.get("current_start")
    )
    razorpay_current_end = timestamp_to_datetime(
        razorpay_subscription.get("current_end")
    )
    razorpay_charge_at = timestamp_to_datetime(razorpay_subscription.get("charge_at"))
    razorpay_start_at = timestamp_to_datetime(razorpay_subscription.get("start_at"))
    razorpay_end_at = timestamp_to_datetime(razorpay_subscription.get("end_at"))

    # Always set meaningful defaults for a new subscription
    start_at = razorpay_start_at or current_time
    current_start = razorpay_current_start or start_at
    charge_at = razorpay_charge_at or current_start

    # Calculate current_end based on plan duration
    if razorpay_current_end:
        current_end = razorpay_current_end
    elif plan:
        if plan.duration == "monthly":
            current_end = current_start + timedelta(days=30)
        elif plan.duration == "yearly":
            current_end = current_start + timedelta(days=365)
        else:
            current_end = current_start + timedelta(days=30)  # Default to monthly
    else:
        current_end = current_start + timedelta(days=30)  # Fallback default

    # Calculate subscription end date based on total cycles
    if razorpay_end_at:
        end_at = razorpay_end_at
    elif plan:
        total_count = razorpay_subscription.get("total_count", 10)
        if plan.duration == "monthly":
            end_at = start_at + timedelta(days=30 * total_count)
        elif plan.duration == "yearly":
            end_at = start_at + timedelta(days=365 * total_count)
        else:
            end_at = start_at + timedelta(days=30 * total_count)  # Default to monthly
    else:
        end_at = start_at + timedelta(days=300)  # Fallback: 10 months

    return {
        "start_at": start_at,
        "current_start": current_start,
        "current_end": current_end,
        "charge_at": charge_at,
        "end_at": end_at,
    }
