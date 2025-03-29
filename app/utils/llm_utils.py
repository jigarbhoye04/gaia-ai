import json
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.prompts.system.calendar_prompts import CALENDAR_EVENT_CREATOR

http_async_client = httpx.AsyncClient(timeout=1000000)
http_sync_client = httpx.Client(timeout=1000000)


async def do_prompt_with_stream(
    messages: list,
    context: dict,
    temperature: float = 0.6,
    max_tokens: int = 2048,
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
            async for line in process_streaming(
                response=response,
                user_message=user_message,
                context=context,
                intent=intent,
            ):
                yield line
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        yield f'data: {{"error": "An unexpected error occurred: {e}"}}\n\n'


async def do_prompt_with_stream_simple(
    messages: list,
    temperature: float = 0.6,
    max_tokens: int = 256,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
):
    json_data = {
        "stream": "true",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "model": model,
    }

    try:
        async with http_async_client.stream(
            "POST", settings.LLM_URL, json=json_data
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                line = line.strip()
                if not line:
                    continue

                yield line + "\n\n"

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code}: {e}")
        yield f'data: {{"error": "HTTP error: {e.response.status_code}"}}\n\n'
    except httpx.StreamError as e:
        logger.error(f"Stream error: {e}")
        yield f'data: {{"error": "Stream error occurred: {e}"}}\n\n'
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        yield f'data: {{"error": "An unexpected error occurred: {e}"}}\n\n'


async def process_streaming(
    response, user_message: str, context, intent: Optional[str] = None
):
    """Process the streaming response from the LLM API."""
    bot_message = ""
    async for line in response.aiter_lines():
        if not line:
            continue

        content = line.removeprefix("data:").strip()

        if content == "[DONE]":
            if context.get("search_results", None):
                yield f"data: {json.dumps({'search_results': context['search_results']})}\n\n"

            if context.get("deep_search_results", None):
                yield f"data: {json.dumps({'deep_search_results': context['deep_search_results']})}\n\n"

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
    system_prompt = CALENDAR_EVENT_CREATOR

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
    system_prompt: str = None,
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
                    "content": f"{f'System: {system_prompt}. User Prompt: ' if system_prompt else ''} {prompt}",
                }
            ],
        },
        http_async_client,
    )


def do_prompt_no_stream_sync(
    prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    system_prompt: str = None,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> dict:
    """Send a prompt to the LLM API without streaming."""
    return make_llm_request_sync(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": f"{f'System: {system_prompt}. User Prompt: ' if system_prompt else ''} {prompt}",
                }
            ],
        },
        http_sync_client,
    )


async def extract_last_user_message(messages: List[dict]) -> str:
    """Extract the last user message."""
    return next(
        (msg["content"] for msg in reversed(messages) if msg.get("role") == "user"), ""
    )


async def make_llm_request(payload: dict, http_async_client: httpx.AsyncClient) -> dict:
    """Helper function to make a request to the LLM API."""
    try:
        response = await http_async_client.post(settings.LLM_URL, json=payload)
        response.raise_for_status()
        return response.json()
    except (httpx.RequestError, ValueError) as e:
        logger.error(f"Request error: {e}")
        return {"error": str(e)}


def make_llm_request_sync(payload: dict, http_client: httpx.Client) -> dict:
    """Helper function to make a request to the LLM API."""
    try:
        response = http_client.post(settings.LLM_URL, json=payload)
        response.raise_for_status()
        return response.json()
    except (httpx.RequestError, ValueError) as e:
        logger.error(f"Request error: {e}")
        return {"error": str(e)}
