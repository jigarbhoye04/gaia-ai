from app.services.text import parse_calendar_info
from app.services.text import classify_event_type


def get_event_details(message):
    response_json = classify_event_type(message)
    calendar_score = response_json.get("scores")[0]
    if calendar_score >= 0.6:
        time_and_date = parse_calendar_info(response_json.get("sequence"))
        return time_and_date
