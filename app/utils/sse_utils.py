import json


def format_tool_response(tool_name: str | None, content: str) -> str:
    """
    Format the tool response to SSE-compatible JSON string.

    Args:
        tool_name (str): Name of the tool used
        content (str): JSON string returned by the tool

    Returns:
        str: SSE-formatted string or empty string if unsupported tool
    """

    if not tool_name or not content:
        return ""

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return ""

    if tool_name == "get_weather":
        return f"data: {json.dumps({'intent': 'weather', 'weather_data': data.get('raw_weather_data', '')})}\n\n"

    elif tool_name == "web_search":
        return f"data: {json.dumps({'search_results': data.get('raw_search_data', '')})}\n\n"

    elif tool_name == "deep_search":
        return f"data: {json.dumps({'type': 'deep_search_data', 'data': data.get('raw_deep_search_data', '')})}\n\n"

    elif tool_name == "fetch_webpages":
        return f"data: {json.dumps({'type': 'webpage_data', 'data': data.get('raw_webpage_data', '')})}\n\n"

    return ""
