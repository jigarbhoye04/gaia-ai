"""
Subscription cleanup and reconciliation tasks.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import subscriptions_collection
from app.services.payments.client import razorpay_service


async def cleanup_abandoned_subscriptions() -> Dict[str, Any]:
    """
    Clean up abandoned subscriptions that were created but never paid.
    Removes subscriptions in 'created' status older than 30 minutes.
    """
    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=30)

        # Find abandoned subscriptions
        abandoned_subscriptions = subscriptions_collection.find(
            {"status": "created", "paid_count": 0, "created_at": {"$lt": cutoff_time}}
        )

        cleanup_count = 0
        async for subscription in abandoned_subscriptions:
            try:
                # Cancel in Razorpay if it exists
                razorpay_subscription_id = subscription.get("razorpay_subscription_id")
                if razorpay_subscription_id:
                    try:
                        razorpay_service.client.subscription.cancel(
                            razorpay_subscription_id
                        )
                        logger.info(
                            f"Cancelled Razorpay subscription: {razorpay_subscription_id}"
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to cancel Razorpay subscription {razorpay_subscription_id}: {e}"
                        )

                # Remove from our database
                await subscriptions_collection.delete_one({"_id": subscription["_id"]})
                cleanup_count += 1

                logger.info(f"Cleaned up abandoned subscription: {subscription['_id']}")

            except Exception as e:
                logger.error(
                    f"Failed to cleanup subscription {subscription.get('_id')}: {e}"
                )
                continue

        result = {
            "status": "completed",
            "cleaned_up_count": cleanup_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if cleanup_count > 0:
            logger.info(f"Cleaned up {cleanup_count} abandoned subscriptions")

        return result

    except Exception as e:
        logger.error(f"Error during subscription cleanup: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


async def reconcile_subscription_payments() -> Dict[str, Any]:
    """
    Reconcile subscription payments with Razorpay.
    Syncs payment status for subscriptions that might be out of sync.
    """
    try:
        # Find active subscriptions that might need reconciliation
        suspect_subscriptions = subscriptions_collection.find(
            {
                "status": "active",
                "paid_count": 0,  # Active but no payments recorded
                "created_at": {"$gte": datetime.now(timezone.utc) - timedelta(days=7)},
            }
        )

        reconciled_count = 0
        deactivated_count = 0

        async for subscription in suspect_subscriptions:
            try:
                razorpay_subscription_id = subscription.get("razorpay_subscription_id")
                if not razorpay_subscription_id:
                    continue

                # Fetch latest status from Razorpay
                razorpay_subscription = razorpay_service.client.subscription.fetch(
                    razorpay_subscription_id
                )

                razorpay_status = razorpay_subscription.get("status")
                razorpay_paid_count = razorpay_subscription.get("paid_count", 0)

                # If Razorpay shows no payments, deactivate subscription
                if razorpay_paid_count == 0 and razorpay_status != "active":
                    await subscriptions_collection.update_one(
                        {"_id": subscription["_id"]},
                        {
                            "$set": {
                                "status": "cancelled",
                                "updated_at": datetime.now(timezone.utc),
                            }
                        },
                    )
                    deactivated_count += 1
                    logger.info(
                        f"Deactivated unpaid subscription: {subscription['_id']}"
                    )

                # If Razorpay shows payments, update our records
                elif razorpay_paid_count > 0:
                    await subscriptions_collection.update_one(
                        {"_id": subscription["_id"]},
                        {
                            "$set": {
                                "paid_count": razorpay_paid_count,
                                "status": razorpay_status,
                                "updated_at": datetime.now(timezone.utc),
                            }
                        },
                    )
                    reconciled_count += 1
                    logger.info(f"Reconciled subscription: {subscription['_id']}")

            except Exception as e:
                logger.error(
                    f"Failed to reconcile subscription {subscription.get('_id')}: {e}"
                )
                continue

        result = {
            "status": "completed",
            "reconciled_count": reconciled_count,
            "deactivated_count": deactivated_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        if reconciled_count > 0 or deactivated_count > 0:
            logger.info(
                f"Reconciliation completed: {reconciled_count} reconciled, {deactivated_count} deactivated"
            )

        return result

    except Exception as e:
        logger.error(f"Error during subscription reconciliation: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
