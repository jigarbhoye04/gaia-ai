"""
Razorpay client and signature verification utilities.
"""

import hashlib
import hmac
from typing import Optional, Dict, Any

import razorpay

from app.config.loggers import general_logger as logger
from app.config.settings import settings


class PaymentServiceError(Exception):
    """Base exception for payment service errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
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
            self.client: razorpay.Client = razorpay.Client(auth=(key_id, key_secret))

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
        self,
        razorpay_payment_id: str,
        razorpay_subscription_id: str,
        razorpay_signature: str,
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
