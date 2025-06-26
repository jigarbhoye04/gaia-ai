"""
Script to create default subscription plans for the application.
Run this script to set up initial subscription plans in the database.
"""

import asyncio

from app.models.payment_models import CreatePlanRequest, Currency, PlanDuration
from app.services.payment_service import create_plan


async def create_default_plans():
    """Create default subscription plans."""
    print("Creating default subscription plans...")

    # Free Plan (Monthly)
    free_plan = CreatePlanRequest(
        name="Free Plan",
        description="Basic features",
        amount=0,  # Free
        currency=Currency.USD,
        duration=PlanDuration.MONTHLY,
        max_users=1,
        features=[
            "Basic chat functionality",
            "20 file uploads per month",
            "Limited calendar management",
            "Limited email management",
            "Limited proactive events",
            "Basic (non-AI) reminders",
            "Limited image generation",
            "Limited memory",
            "Track up to 3 goals",
            "Unlimited web search",
            "3 deep research sessions",
            "Basic calendar integration",
            "Limited notes storage (100 notes)",
            "Basic support",
            "To-do list management",
        ],
        is_active=True,
)
    # Pro Plan (Monthly)
    pro_monthly = CreatePlanRequest(
        name="Pro Monthly",
        description="For productivity nerds",
        amount=2000,  # 20.00 USD per month
        currency=Currency.USD,
        duration=PlanDuration.MONTHLY,
        max_users=5,
        features=[
            "Everything in Basic",
            "Unlimited file uploads",
            "Unlimited calendar management",
            "Unlimited email management",
            "Unlimited proactive events",
            "AI-powered smart reminders",
            "Unlimited image generation",
            "Extended memory",
            "Unlimited goal tracking",
            "Unlimited deep research",
            "Advanced AI models",
            "Premium support",
            "Private Discord channels",
            "Priority access to new features",
            "To-do list management",
        ],
        is_active=True,
    )

    # Pro Plan (Yearly)
    pro_yearly = CreatePlanRequest(
        name="Pro Yearly",
        description="For productivity nerds (Save 3 months)",
        amount=18000,  # 180.00 USD per year (3 months free), 15 per month
        currency=Currency.USD,
        duration=PlanDuration.YEARLY,
        max_users=5,
        features=[
            "Everything in Basic",
            "Unlimited file uploads",
            "Unlimited calendar management",
            "Unlimited email management",
            "Unlimited proactive events",
            "AI-powered smart reminders",
            "Unlimited image generation",
            "Extended memory",
            "Unlimited goal tracking",
            "Unlimited deep research",
            "Premium support",
            "Custom branding",
            "Private Discord channels",
            "Priority access to new features",
            "2 months free!",
            "To-do list management",
        ],
        is_active=True,
    )

    plans = [
        free_plan,
        pro_monthly,
        pro_yearly,
    ]

    created_plans = []
    for plan in plans:
        try:
            created_plan = await create_plan(plan)
            created_plans.append(created_plan)
            print(
                f"✅ Created plan: {created_plan.name} (₹{created_plan.amount/100:.2f})"
            )
        except Exception as e:
            print(f"❌ Failed to create plan {plan.name}: {e}")

    print(f"\n🎉 Successfully created {len(created_plans)} subscription plans!")
    return created_plans


async def main():
    """Main function to run the plan creation script."""
    print("🚀 GAIA Subscription Plans Setup")
    print("=" * 40)

    try:
        plans = await create_default_plans()

        print("\n📋 Summary of created plans:")
        for plan in plans:
            print(f"- {plan.name}: ₹{plan.amount/100:.2f}/{plan.duration}")

        print("\n✅ All plans created successfully!")
        print("You can now use the payment system in your application.")

    except Exception as e:
        print(f"❌ Error creating plans: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
