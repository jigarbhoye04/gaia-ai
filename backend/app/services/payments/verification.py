"""
Payment verification and processing.
"""

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import (
    payments_collection,
    subscriptions_collection,
    users_collection,
)
from app.models.payment_models import (
    PaymentCallbackRequest,
    PaymentDB,
    PaymentMethod,
    PaymentResponse,
    PaymentStatus,
)
from app.utils.email_utils import send_pro_subscription_email
from app.utils.payments_utils import safe_get_notes

from .client import razorpay_service


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
            logger.error(
                "No order_id or subscription_id provided for signature verification"
            )
            raise HTTPException(
                status_code=400,
                detail="Missing order_id or subscription_id for verification",
            )

        if not is_valid:
            logger.error(
                f"Invalid payment signature for payment_id: {callback_data.razorpay_payment_id}"
            )
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        mode = "test" if razorpay_service.is_test_mode else "live"
        logger.info(f"Payment signature verified successfully in {mode} mode")

        # Fetch payment details from Razorpay
        try:
            razorpay_payment = razorpay_service.client.payment.fetch(
                callback_data.razorpay_payment_id
            )
            logger.info(
                f"Fetched payment data in {mode} mode: {callback_data.razorpay_payment_id}"
            )
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {e}")
            raise HTTPException(
                status_code=502, detail="Failed to fetch payment details"
            )

        # Store payment in database
        try:
            # Determine payment method
            payment_method = None
            if razorpay_payment.get("method"):
                try:
                    payment_method = PaymentMethod(razorpay_payment["method"])
                except ValueError:
                    payment_method = None

            current_time = datetime.now(timezone.utc)
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
                notes=safe_get_notes(razorpay_payment.get("notes")),
                created_at=current_time,
            )

            result = await payments_collection.insert_one(
                payment_doc.dict(by_alias=True, exclude={"id"})
            )
            payment_doc.id = str(result.inserted_id)

            if not result.inserted_id:
                raise HTTPException(
                    status_code=500, detail="Failed to store payment in database"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to store payment in database: {e}")
            raise HTTPException(status_code=500, detail="Failed to save payment")

        # If this payment is for a subscription, activate the subscription
        if callback_data.razorpay_subscription_id:
            try:
                result = await subscriptions_collection.update_one(
                    {
                        "razorpay_subscription_id": callback_data.razorpay_subscription_id
                    },
                    {
                        "$set": {
                            "status": "active",
                            "paid_count": 1,
                            "updated_at": datetime.now(timezone.utc),
                        }
                    },
                )
                subscription_activated = result.modified_count > 0
                if subscription_activated:
                    logger.info(
                        f"Activated subscription: {callback_data.razorpay_subscription_id}"
                    )
                else:
                    logger.warning(
                        f"No subscription found to activate: {callback_data.razorpay_subscription_id}"
                    )
            except Exception as e:
                logger.error(
                    f"Failed to activate subscription {callback_data.razorpay_subscription_id}: {e}"
                )
                subscription_activated = False

            # Send pro activation email to the user if subscription was activated
            if subscription_activated:
                try:
                    user = await users_collection.find_one({"_id": ObjectId(user_id)})
                    logger.info(user)
                    if user:
                        await send_pro_subscription_email(
                            user_name=user.get("first_name", user.get("name", "there")),
                            user_email=user["email"],
                        )
                        logger.info(
                            f"Pro subscription welcome email sent to {user['email']}"
                        )
                except Exception as e:
                    logger.error(
                        f"Failed to send pro subscription email to user {user_id}: {e}"
                    )

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
