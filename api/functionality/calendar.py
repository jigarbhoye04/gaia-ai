
from models.named_entity_recognition import parse_calendar_info
from models.zero_shot_classification import classify_event_type


def get_event_details(message):
    response_json = classify_event_type(message)
    calendar_score = response_json.get("scores")[0]
    if calendar_score >= 0.6:
        time_and_date = parse_calendar_info(response_json.get("sequence"))
        return time_and_date
