from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel, Field
from enum import Enum

class UsagePeriod(str, Enum):
    DAY = "day"
    MONTH = "month"


class FeatureUsage(BaseModel):
    feature_key: str
    feature_title: str
    period: UsagePeriod
    used: int = 0
    limit: int = 0
    reset_time: datetime
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserUsageSnapshot(BaseModel):
    user_id: str
    plan_type: str
    features: List[FeatureUsage] = []
    snapshot_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


