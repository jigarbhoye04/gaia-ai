"""
Quick test script for inactive user emails.
Run this to test the inactive user detection and email sending.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import sys
import os

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


async def test_inactive_users():
    # Initialize MongoDB connection
    from app.db.mongodb.mongodb import init_mongodb

    mongo_client = init_mongodb()

    # Import required modules
    from app.db.mongodb.collections import users_collection
    from app.arq_worker import check_inactive_users

    print("🔍 Testing Inactive User Detection...\n")

    # Find a test user
    test_user = await users_collection.find_one({})
    if not test_user:
        print("❌ No users found in database")
        return

    print(f"📧 Using test user: {test_user['email']}")

    # Set the user as inactive (8 days ago)
    eight_days_ago = datetime.now(timezone.utc) - timedelta(days=8)
    await users_collection.update_one(
        {"_id": test_user["_id"]}, {"$set": {"last_active_at": eight_days_ago}}
    )
    print(f"✅ Set user last_active_at to: {eight_days_ago}")

    # Run the inactive user check
    print("\n🚀 Running inactive user check...")
    result = await check_inactive_users({})
    print(f"✅ Result: {result}")

    # Reset the user's activity to now (cleanup)
    await users_collection.update_one(
        {"_id": test_user["_id"]},
        {"$set": {"last_active_at": datetime.now(timezone.utc)}},
    )
    print("\n🔄 Reset user activity to current time")


if __name__ == "__main__":
    print("=" * 50)
    print("INACTIVE USER EMAIL TEST")
    print("=" * 50)
    asyncio.run(test_inactive_users())
