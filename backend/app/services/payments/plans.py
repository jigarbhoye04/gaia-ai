"""
Plans management service.
"""

from typing import List, Optional

from bson import ObjectId
from fastapi import HTTPException

from app.config.loggers import general_logger as logger
from app.db.mongodb.collections import plans_collection
from app.models.payment_models import PlanResponse


async def get_plans(active_only: bool = True) -> List[PlanResponse]:
    """Get all subscription plans."""
    try:
        query = {"is_active": True} if active_only else {}
        plans_cursor = plans_collection.find(query).sort("amount", 1)
        plans = await plans_cursor.to_list(length=None)

        return [
            PlanResponse(
                id=str(plan["_id"]),
                name=plan["name"],
                description=plan.get("description"),
                amount=plan["amount"],
                currency=plan["currency"],
                duration=plan["duration"],
                max_users=plan.get("max_users"),
                features=plan.get("features", []),
                is_active=plan["is_active"],
                created_at=plan["created_at"],
                updated_at=plan["updated_at"],
            )
            for plan in plans
        ]
    except Exception as e:
        logger.error(f"Failed to fetch plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plans")


async def get_plan_by_id(plan_id: str) -> Optional[PlanResponse]:
    """Get a specific plan by ID."""
    try:
        if not ObjectId.is_valid(plan_id):
            raise HTTPException(status_code=400, detail="Invalid plan ID format")
            
        plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        
        if not plan:
            return None

        return PlanResponse(
            id=str(plan["_id"]),
            name=plan["name"],
            description=plan.get("description"),
            amount=plan["amount"],
            currency=plan["currency"],
            duration=plan["duration"],
            max_users=plan.get("max_users"),
            features=plan.get("features", []),
            is_active=plan["is_active"],
            created_at=plan["created_at"],
            updated_at=plan["updated_at"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch plan {plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plan")


async def get_razorpay_plan_id(plan_id: str) -> str:
    """Get Razorpay plan ID from our plan ID."""
    try:
        plan = await plans_collection.find_one({"_id": ObjectId(plan_id)})
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        logger.info(f'plan["razorpay_plan_id"]={plan["razorpay_plan_id"]}')
        return plan["razorpay_plan_id"]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get Razorpay plan ID for {plan_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve plan details")
