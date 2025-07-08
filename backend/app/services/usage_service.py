"""
Usage tracking service for database operations.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.db.mongodb.collections import usage_snapshots_collection
from app.models.usage_models import UserUsageSnapshot


class UsageService:
    @staticmethod
    def _prepare_doc_for_model(doc: dict) -> dict:
        """Helper to prepare MongoDB document for Pydantic model."""
        doc["_id"] = str(doc["_id"])
        return doc

    @staticmethod
    async def save_usage_snapshot(snapshot: UserUsageSnapshot) -> str:
        snapshot_dict = snapshot.model_dump()
        result = await usage_snapshots_collection.insert_one(snapshot_dict)
        return str(result.inserted_id)

    @staticmethod
    async def get_latest_usage_snapshot(user_id: str) -> Optional[UserUsageSnapshot]:
        snapshot_doc = await usage_snapshots_collection.find_one(
            {"user_id": user_id}, sort=[("created_at", -1)]
        )
        if snapshot_doc:
            return UserUsageSnapshot(
                **UsageService._prepare_doc_for_model(snapshot_doc)
            )
        return None

    @staticmethod
    async def get_usage_history(
        user_id: str, feature_key: Optional[str] = None, days: int = 30
    ) -> List[UserUsageSnapshot]:
        query = {
            "user_id": user_id,
            "created_at": {
                "$gte": datetime.now(timezone.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                )
                - timedelta(days=days)
            },
        }

        snapshots = []
        async for doc in usage_snapshots_collection.find(query).sort("created_at", -1):
            snapshot = UserUsageSnapshot(**UsageService._prepare_doc_for_model(doc))

            if feature_key:
                # Filter to only include the requested feature (create new list, don't mutate)
                filtered_features = [
                    f for f in snapshot.features if f.feature_key == feature_key
                ]
                if filtered_features:
                    snapshot.features = filtered_features
                    snapshots.append(snapshot)
            else:
                snapshots.append(snapshot)

        return snapshots
