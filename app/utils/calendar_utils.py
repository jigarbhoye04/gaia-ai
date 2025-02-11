from http.client import HTTPException
from zoneinfo import ZoneInfo
import pytz
import pendulum


def resolve_timezone(timezone: str) -> str:
    """
    Use Pendulum to convert a potentially non-canonical timezone name
    (e.g. "Asia/Calcutta") to its canonical form (e.g. "Asia/Kolkata").
    """
    try:
        # pendulum.timezone(...) returns a Pendulum timezone instance.
        # Its `.name` property holds the canonical name.
        return pendulum.timezone(timezone).name
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid timezone: '{timezone}'")
