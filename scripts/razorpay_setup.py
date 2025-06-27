#!/usr/bin/env python3
"""
Complete Razorpay setup script for GAIA.
This script sets up subscription plans in the database using existing Razorpay plan IDs.
"""

import sys
import os
import asyncio
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb.collections import plans_collection
from app.models.payment_models import PlanDB, CreatePlanRequest, Currency, PlanDuration
from app.config.settings import settings


async def setup_razorpay_plans():
    """Set up GAIA subscription plans in the database using existing Razorpay plan IDs."""
    
    print("🚀 GAIA Razorpay Setup")
    print("=" * 40)
    
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        print("❌ Razorpay credentials not found in settings")
        print("Please check your Infisical configuration")
        return
    
    print(f"🔗 Using Razorpay Key: {settings.RAZORPAY_KEY_ID}")
    
    # Define plans with their corresponding Razorpay plan IDs
    plans_to_create = [
        {
            "razorpay_plan_id": "plan_QlyNGEi4zjFJfs",  # Monthly plan
            "plan": CreatePlanRequest(
                name="GAIA Pro Monthly",
                description="For productivity nerds - billed monthly",
                amount=171200,  # ₹1,712.00 in paise
                currency=Currency.INR,
                duration=PlanDuration.MONTHLY,
                max_users=1,
                features=[
                    "Unlimited chat functionality",
                    "Unlimited file uploads",
                    "Advanced calendar management",
                    "Advanced email management",
                    "Unlimited proactive events",
                    "AI-powered reminders",
                    "Unlimited image generation",
                    "Advanced memory",
                    "Track unlimited goals",
                    "Unlimited web search",
                    "Unlimited deep research sessions",
                    "Advanced calendar integration",
                    "Unlimited notes storage",
                    "Priority support",
                    "Advanced to-do list management",
                    "Custom AI personas",
                    "Advanced analytics",
                    "API access"
                ],
                is_active=True
            )
        },
        {
            "razorpay_plan_id": "plan_QlyNxAapbw4UTe",  # Yearly plan
            "plan": CreatePlanRequest(
                name="GAIA Pro Yearly",
                description="For productivity nerds - billed annually (save ₹5,131/year)",
                amount=1541300,  # ₹15,413.00 in paise
                currency=Currency.INR,
                duration=PlanDuration.YEARLY,
                max_users=1,
                features=[
                    "Unlimited chat functionality",
                    "Unlimited file uploads", 
                    "Advanced calendar management",
                    "Advanced email management",
                    "Unlimited proactive events",
                    "AI-powered reminders",
                    "Unlimited image generation",
                    "Advanced memory",
                    "Track unlimited goals",
                    "Unlimited web search",
                    "Unlimited deep research sessions",
                    "Advanced calendar integration",
                    "Unlimited notes storage",
                    "Priority support",
                    "Advanced to-do list management",
                    "Custom AI personas",
                    "Advanced analytics",
                    "API access",
                    "Annual discount - Save ₹5,131"
                ],
                is_active=True
            )
        }
    ]
    
    created_plans = []
    
    print("\n🔄 Setting up plans in database...")
    
    # Check if plans already exist
    try:
        existing_count = await plans_collection.count_documents({})
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing plans in database")
            choice = input("Do you want to clear existing plans and recreate? (y/N): ").strip().lower()
            if choice == 'y':
                result = await plans_collection.delete_many({})
                print(f"🗑️  Deleted {result.deleted_count} existing plans")
            else:
                print("✅ Keeping existing plans. Exiting...")
                return
    except Exception as e:
        print(f"⚠️  Error checking existing plans: {e}")
    
    # Create plans in database
    for plan_item in plans_to_create:
        try:
            plan_data = plan_item["plan"]
            razorpay_plan_id = plan_item["razorpay_plan_id"]
            
            print(f"\n🔄 Creating: {plan_data.name}...")
            
            current_time = datetime.utcnow()
            plan_doc = PlanDB(
                razorpay_plan_id=razorpay_plan_id,
                name=plan_data.name,
                description=plan_data.description,
                amount=plan_data.amount,
                currency=plan_data.currency.value,  # Get string value from enum
                duration=plan_data.duration.value,  # Get string value from enum
                max_users=plan_data.max_users,
                features=plan_data.features,
                is_active=plan_data.is_active,
                created_at=current_time,
                updated_at=current_time,
            )
            
            result = await plans_collection.insert_one(plan_doc.dict(exclude={"id"}))
            plan_doc.id = str(result.inserted_id)
            created_plans.append(plan_doc)
            
            print(f"✅ Created plan: {plan_data.name}")
            print(f"   📋 Database ID: {plan_doc.id}")
            print(f"   🏷️  Razorpay Plan ID: {razorpay_plan_id}")
            print(f"   💰 Amount: ₹{plan_data.amount/100:.2f}")
            print(f"   📅 Duration: {plan_data.duration.value}")
            
        except Exception as e:
            print(f"❌ Failed to create {plan_data.name}: {e}")
            continue
    
    print(f"\n🎉 Successfully created {len(created_plans)} plans in database!")
    
    if created_plans:
        print("\n📋 Summary:")
        print("-" * 60)
        for plan in created_plans:
            print(f"Plan: {plan.name}")
            print(f"Database ID: {plan.id}")
            print(f"Razorpay Plan ID: {plan.razorpay_plan_id}")
            print(f"Amount: ₹{plan.amount/100:.2f}")
            print(f"Duration: {plan.duration}")
            print("-" * 30)
        
        print("\n✅ Your payment system is now ready!")
        print("🔗 Frontend can now fetch plans via GET /api/v1/payments/plans")
        print("💳 Users can subscribe using the plan IDs from the database")
    
    return created_plans

async def main():
    """Main function."""
    try:
        await setup_razorpay_plans()
        print("\n🎉 Razorpay setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
