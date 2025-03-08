import json
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.utils.llm_utils import extract_last_user_message, make_llm_request

http_async_client = httpx.AsyncClient(timeout=1000000.0)


async def do_prompt_with_stream(
    messages: list,
    temperature: float = 0.6,
    max_tokens: int = 256,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
    intent=None,
):
    """Send a prompt to the LLM API with streaming enabled."""
    try:
        user_message = await extract_last_user_message(messages)
        json = {
            "stream": "true",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
            "model": model,
        }

        async with http_async_client.stream(
            "POST",
            settings.LLM_URL,
            json=json,
        ) as response:
            response.raise_for_status()
            async for line in process_streaming(response, user_message, intent):
                yield line
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        yield f'data: {{"error": "An unexpected error occurred: {e}"}}\n\n'


async def process_streaming(response, user_message: str, intent: Optional[str] = None):
    """Process the streaming response from the LLM API."""
    bot_message = ""
    async for line in response.aiter_lines():
        if not line:
            continue

        content = line.removeprefix("data:").strip()

        if content == "[DONE]":
            if intent == "calendar":
                success, options = await process_calendar_event(
                    user_message, bot_message
                )
                if success:
                    yield f"data: {json.dumps({'intent': 'calendar', 'calendar_options': options})}\n\n"
            yield "data: [DONE]\n\n"
            break
        bot_message += json.loads(content).get("response", "")
        yield line + "\n\n"


async def process_calendar_event(message: str, bot_message: str = ""):
    """Create a calendar event using the LLM."""
    now = datetime.now(timezone.utc)
    prompt = (
        f"This is the user message: {message}. The current date and time is: {now.isoformat()}. "
        f"Today's day is {now.strftime('%A')}. This is the assistant's message: {bot_message}"
    )
    system_prompt = (
        """
        You are an intelligent assistant specialized in creating calendar events. You are provided with a user message and the current date and time. Your task is to analyze both and produce a JSON object describing calendar event(s) accordingly.
        Output a single-line JSON object exactly in the following format with no additional text or formatting:
        {"intent": "calendar", "calendar_options": <event_data>}
        Where <event_data> must be either a single event object or an array of event objects. Each event object must have exactly these four keys: "summary", "description", "start", and "end". The "start" and "end" values must be valid ISO 8601 formatted datetime strings.
        Strict rules:
        1. Output only one JSON object on a single line.
        2. The "intent" field must be exactly "calendar".
        3. If multiple events are relevant, "calendar_options" must be an array; otherwise, it can be a single object.
        4. Do not include any extra text, line breaks, or commentary.
        5. Do not add any markdown formatting at all.
        """,
    )

    result = await do_prompt_no_stream(
        prompt=prompt, system_prompt=system_prompt, max_tokens=4096
    )

    print("result", result)
    if isinstance(result, dict) and result.get("response"):
        print("if", isinstance(result, dict))
        try:
            print("before parsed_result", result.get("response"))
            parsed_result = json.loads(result["response"])
            print("parsed_result", parsed_result)
            if parsed_result.get("intent") == "calendar" and parsed_result.get(
                "calendar_options"
            ):
                return True, parsed_result["calendar_options"]
        except Exception:
            return False, None
    return False, None


async def do_prompt_no_stream(
    prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    system_prompt: str = "",
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> dict:
    """Send a prompt to the LLM API without streaming."""
    return await make_llm_request(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": f"System: {system_prompt} User Prompt: {prompt}",
                }
            ],
        },
        http_async_client,
    )
