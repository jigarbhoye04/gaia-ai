#!/usr/bin/env python3
"""
Complete Razorpay setup script for GAIA.
This script sets up subscription plans in the database using existing Razorpay plan IDs.

Usage:
    # Development environment (default)
    python razorpay_setup.py

    # Production environment
    python razorpay_setup.py --prod
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


async def setup_razorpay_plans(is_prod: bool = False):
    """Set up GAIA subscription plans in the database using existing Razorpay plan IDs."""

    env_type = "PRODUCTION" if is_prod else "DEVELOPMENT"
    print(f"🚀 GAIA Razorpay Setup ({env_type})")
    print("=" * 40)

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        print("❌ Razorpay credentials not found in settings")
        print("Please check your Infisical configuration")
        return

    print(f"🔗 Using Razorpay Key: {settings.RAZORPAY_KEY_ID}")
    print(f"🌍 Environment: {env_type}")

    # Define plan IDs based on environment
    if is_prod:
        # Production Razorpay plan IDs
        monthly_plan_id = "plan_QzntOT0NuTyA4t"
        yearly_plan_id = "plan_Qznu3PaP1ZmY1X"
    else:
        # Development/Testing Razorpay plan IDs
        monthly_plan_id = "plan_QmJ1F2fJOIzSea"
        yearly_plan_id = "plan_QmJ1bew3wsABYv"

    # Define plans with their corresponding Razorpay plan IDs
    plans_to_create = [
        {
            "razorpay_plan_id": None,  # Free plan doesn't need Razorpay plan ID
            "plan": CreatePlanRequest(
                name="Free",
                description="Get started with GAIA for free",
                amount=0,  # Free plan
                currency=Currency.USD,
                duration=PlanDuration.MONTHLY,
                max_users=1,
                features=[
                    "Limited file uploads",
                    "Limited calendar management",
                    "Limited email actions",
                    "Limited AI image generation",
                    "Limited goal tracking",
                    "Limited web search",
                    "Limited deep research",
                    "Limited todo operations",
                    "Limited reminders",
                    "Limited weather checks",
                    "Limited webpage fetch",
                    "Limited document generation",
                    "Limited flowchart creation",
                    "Limited code execution",
                    "Limited Google Docs operations",
                    "Basic memory features",
                    "Standard support",
                ],
                is_active=True,
            ),
        },
        {
            "razorpay_plan_id": None,  # Free yearly plan
            "plan": CreatePlanRequest(
                name="Free",
                description="Get started with GAIA for free - annual commitment",
                amount=0,  # Free plan
                currency=Currency.USD,
                duration=PlanDuration.YEARLY,
                max_users=1,
                features=[
                    "Limited file uploads",
                    "Limited calendar management",
                    "Limited email actions",
                    "Limited AI image generation",
                    "Limited goal tracking",
                    "Limited web search",
                    "Limited deep research",
                    "Limited todo operations",
                    "Limited reminders",
                    "Limited weather checks",
                    "Limited webpage fetch",
                    "Limited document generation",
                    "Limited flowchart creation",
                    "Limited code execution",
                    "Limited Google Docs operations",
                    "Basic memory features",
                    "Standard support",
                ],
                is_active=True,
            ),
        },
        {
            "razorpay_plan_id": monthly_plan_id,  # Monthly plan
            "plan": CreatePlanRequest(
                name="GAIA Pro",
                description="For productivity nerds - billed monthly",
                amount=1000,  # $10.00 in cents
                currency=Currency.USD,
                duration=PlanDuration.MONTHLY,
                max_users=1,
                features=[
                    "Extended file uploads",
                    "Extended calendar management",
                    "Extended email actions",
                    "Extended AI image generation",
                    "Extended goal tracking",
                    "Extended web search",
                    "Extended deep research",
                    "Extended todo operations",
                    "Extended reminders",
                    "Extended weather checks",
                    "Extended webpage fetch",
                    "Extended document generation",
                    "Extended flowchart creation",
                    "Extended code execution",
                    "Extended Google Docs operations",
                    "Advanced memory features",
                    "Private Discord channels",
                    "Priority support",
                ],
                is_active=True,
            ),
        },
        {
            "razorpay_plan_id": yearly_plan_id,  # Yearly plan
            "plan": CreatePlanRequest(
                name="GAIA Pro",
                description="For productivity nerds - billed annually (save $60/year)",
                amount=10000,  # $100.00 in cents (save $20)
                currency=Currency.USD,
                duration=PlanDuration.YEARLY,
                max_users=1,
                features=[
                    "Extended file uploads",
                    "Extended calendar management",
                    "Extended email actions",
                    "Extended AI image generation",
                    "Extended goal tracking",
                    "Extended web search",
                    "Extended deep research",
                    "Extended todo operations",
                    "Extended reminders",
                    "Extended weather checks",
                    "Extended webpage fetch",
                    "Extended document generation",
                    "Extended flowchart creation",
                    "Extended code execution",
                    "Extended Google Docs operations",
                    "Advanced memory features",
                    "Private Discord channels",
                    "Priority support",
                    "Annual discount - Save $60",
                ],
                is_active=True,
            ),
        },
    ]

    created_plans = []

    print("\n🔄 Setting up plans in database...")

    # Check if plans already exist
    try:
        existing_count = await plans_collection.count_documents({})
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing plans in database")
            choice = (
                input("Do you want to clear existing plans and recreate? (y/N): ")
                .strip()
                .lower()
            )
            if choice == "y":
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
                razorpay_plan_id=razorpay_plan_id
                or f"free_plan_{int(current_time.timestamp())}",  # Use a dummy ID for free plans
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

            result = await plans_collection.insert_one(
                plan_doc.model_dump(exclude={"id"})
            )
            plan_doc.id = str(result.inserted_id)
            created_plans.append(plan_doc)

            print(f"✅ Created plan: {plan_data.name}")
            print(f"   📋 Database ID: {plan_doc.id}")
            print(
                f"   🏷️  Razorpay Plan ID: {razorpay_plan_id or 'Free Plan (No Razorpay ID)'}"
            )
            amount_display = (
                f"${plan_data.amount / 100:.2f}" if plan_data.amount > 0 else "Free"
            )
            print(f"   💰 Amount: {amount_display}")
            print(f"   📅 Duration: {plan_data.duration.value}")

        except Exception as e:
            print(f"❌ Failed to create {plan_data.name}: {e}")
            continue

    print(f"\n🎉 Successfully created {len(created_plans)} plans in database!")

    if created_plans:
        print("\n📋 Summary:")
        print("-" * 60)
        for plan in created_plans:
            amount_display = f"${plan.amount / 100:.2f}" if plan.amount > 0 else "Free"
            print(f"Plan: {plan.name}")
            print(f"Database ID: {plan.id}")
            print(f"Razorpay Plan ID: {plan.razorpay_plan_id}")
            print(f"Amount: {amount_display}")
            print(f"Duration: {plan.duration}")
            print("-" * 30)

        print("\n✅ Your payment system is now ready!")
        print("🔗 Frontend can now fetch plans via GET /api/v1/payments/plans")
        print("💳 Users can subscribe using the plan IDs from the database")

    return created_plans


async def main():
    """Main function."""
    import argparse

    parser = argparse.ArgumentParser(description="Setup Razorpay plans for GAIA")
    parser.add_argument(
        "--prod",
        action="store_true",
        help="Use production Razorpay plan IDs (default: development IDs)",
    )
    args = parser.parse_args()

    try:
        await setup_razorpay_plans(is_prod=args.prod)
        env_type = "PRODUCTION" if args.prod else "DEVELOPMENT"
        print(f"\n🎉 Razorpay setup completed successfully for {env_type}!")

    except Exception as e:
        print(f"❌ Error during setup: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
