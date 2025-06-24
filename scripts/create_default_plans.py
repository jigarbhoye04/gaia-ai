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
        description="Basic features for personal use",
        amount=0,  # Free
        currency=Currency.INR,
        duration=PlanDuration.MONTHLY,
        max_users=1,
        features=[
            "Basic chat functionality",
            "5 searches per day",
            "Basic calendar integration",
            "Limited notes storage (100 notes)",
            "Email support",
        ],
        is_active=True,
    )

    # Basic Plan (Monthly)
    basic_monthly = CreatePlanRequest(
        name="Basic Monthly",
        description="Perfect for individual users",
        amount=49900,  # ₹499 per month
        currency=Currency.INR,
        duration=PlanDuration.MONTHLY,
        max_users=1,
        features=[
            "Advanced chat with AI",
            "Unlimited searches",
            "Full calendar integration",
            "Unlimited notes storage",
            "Email and file management",
            "Priority support",
            "Custom AI instructions",
        ],
        is_active=True,
    )

    # Basic Plan (Yearly)
    basic_yearly = CreatePlanRequest(
        name="Basic Yearly",
        description="Perfect for individual users (Save 2 months)",
        amount=499000,  # ₹4990 per year (2 months free)
        currency=Currency.INR,
        duration=PlanDuration.YEARLY,
        max_users=1,
        features=[
            "Advanced chat with AI",
            "Unlimited searches",
            "Full calendar integration",
            "Unlimited notes storage",
            "Email and file management",
            "Priority support",
            "Custom AI instructions",
            "2 months free!",
        ],
        is_active=True,
    )

    # Pro Plan (Monthly)
    pro_monthly = CreatePlanRequest(
        name="Pro Monthly",
        description="For power users and small teams",
        amount=99900,  # ₹999 per month
        currency=Currency.INR,
        duration=PlanDuration.MONTHLY,
        max_users=5,
        features=[
            "Everything in Basic",
            "Team collaboration",
            "Advanced AI models",
            "Custom integrations",
            "Analytics and insights",
            "API access",
            "Premium support",
            "Custom branding",
        ],
        is_active=True,
    )

    # Pro Plan (Yearly)
    pro_yearly = CreatePlanRequest(
        name="Pro Yearly",
        description="For power users and small teams (Save 2 months)",
        amount=999000,  # ₹9990 per year (2 months free)
        currency=Currency.INR,
        duration=PlanDuration.YEARLY,
        max_users=5,
        features=[
            "Everything in Basic",
            "Team collaboration",
            "Advanced AI models",
            "Custom integrations",
            "Analytics and insights",
            "API access",
            "Premium support",
            "Custom branding",
            "2 months free!",
        ],
        is_active=True,
    )

    # Enterprise Plan (Monthly)
    enterprise_monthly = CreatePlanRequest(
        name="Enterprise Monthly",
        description="For large organizations",
        amount=249900,  # ₹2499 per month
        currency=Currency.INR,
        duration=PlanDuration.MONTHLY,
        max_users=None,  # Unlimited
        features=[
            "Everything in Pro",
            "Unlimited users",
            "Advanced security",
            "SSO integration",
            "Custom deployment",
            "Dedicated support",
            "SLA guarantee",
            "Custom training",
            "White-label solution",
        ],
        is_active=True,
    )

    # Enterprise Plan (Yearly)
    enterprise_yearly = CreatePlanRequest(
        name="Enterprise Yearly",
        description="For large organizations (Save 2 months)",
        amount=2499000,  # ₹24990 per year (2 months free)
        currency=Currency.INR,
        duration=PlanDuration.YEARLY,
        max_users=None,  # Unlimited
        features=[
            "Everything in Pro",
            "Unlimited users",
            "Advanced security",
            "SSO integration",
            "Custom deployment",
            "Dedicated support",
            "SLA guarantee",
            "Custom training",
            "White-label solution",
            "2 months free!",
        ],
        is_active=True,
    )

    plans = [
        free_plan,
        basic_monthly,
        basic_yearly,
        pro_monthly,
        pro_yearly,
        enterprise_monthly,
        enterprise_yearly,
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
