import json


def format_tool_response(tool_name: str, content: str) -> str:
    """
    Format the tool response to SSE-compatible JSON string.

    Args:
        tool_name (str): Name of the tool used
        content (str): JSON string returned by the tool

    Returns:
        str: SSE-formatted string or empty string if unsupported tool
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return ""

    if tool_name == "get_weather":
        return f"data: {json.dumps({'type': 'weather_data', 'data': data.get('raw_weather_data', '')})}\n\n"

    elif tool_name == "web_search":
        return f"data: {json.dumps({'type': 'search_data', 'data': data.get('raw_search_data', '')})}\n\n"

    return ""
