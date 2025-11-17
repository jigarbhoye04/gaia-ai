#!/usr/bin/env python3
# mypy: ignore-errors
"""
Cleanup script to remove old "GAIA Pro" plans and keep only Free and Pro plans.

Usage:
    cd /path/to/your/gaia/backend
    python scripts/cleanup_old_plans.py
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.config.settings import settings
from motor.motor_asyncio import AsyncIOMotorClient


async def cleanup_old_plans():
    """Remove old plans and keep only Free and Pro plans."""
    print("🧹 Cleaning up old subscription plans...")
    print("=" * 50)

    client = None
    try:
        client = AsyncIOMotorClient(settings.MONGO_DB)
        db = client["GAIA"]
        collection = db["subscription_plans"]

        # List all current plans
        all_plans = await collection.find({}).to_list(length=None)
        print(f"\n📋 Found {len(all_plans)} plans in database:")
        for plan in all_plans:
            print(f"   • {plan['name']} ({plan['duration']}) - ${plan['amount'] / 100:.2f}")

        # Plans to keep: Free, Pro (monthly), Pro (yearly)
        # Delete any plan named "GAIA Pro"
        result = await collection.delete_many({"name": "GAIA Pro"})
        deleted_count = result.deleted_count

        if deleted_count > 0:
            print(f"\n✅ Deleted {deleted_count} 'GAIA Pro' plan(s)")
        else:
            print("\n✓ No 'GAIA Pro' plans found to delete")

        # List remaining plans
        remaining_plans = await collection.find({"is_active": True}).sort("amount", 1).to_list(length=None)
        print(f"\n📊 Remaining active plans:")
        for plan in remaining_plans:
            print(f"   • {plan['name']} ({plan['duration']}) - ${plan['amount'] / 100:.2f}")

        print("\n✅ Cleanup complete!")
        print("🔄 Refresh your frontend to see the changes")

        return True

    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False
    finally:
        if client:
            client.close()
            print("🔌 Database connection closed")


async def main():
    """Main entry point."""
    try:
        await cleanup_old_plans()
        print("\n🎉 Cleanup completed successfully!")
    except Exception as e:
        print(f"\n💥 Cleanup failed with error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
