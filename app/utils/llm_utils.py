import json
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.prompts.system.calendar_prompts import CALENDAR_EVENT_CREATOR

http_async_client = httpx.AsyncClient(timeout=1000000)
http_sync_client = httpx.Client(timeout=1000000)

# Groq API configuration
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
}
GROQ_MODEL = "llama-3.3-70b-versatile"


async def do_prompt_with_stream(
    messages: list,
    context: dict,
    temperature: float = 0.6,
    max_tokens: int = 2048,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
    intent=None,
):
    """Send a prompt to the LLM API with streaming enabled. Tries Groq first, falls back to original LLM."""
    user_message = await extract_last_user_message(messages)
    bot_message = ""

    # Try Groq first
    try:
        async with http_async_client.stream(
            "POST",
            GROQ_API_URL,
            headers=GROQ_HEADERS,
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue

                json_str = line.removeprefix("data:").strip()
                if json_str == "[DONE]":
                    break

                try:
                    data = json.loads(json_str)
                    if "choices" in data and data["choices"]:
                        choice = data["choices"][0]

                        if choice.get("finish_reason") == "stop":
                            break

                        if "delta" in choice and "content" in choice["delta"]:
                            content = choice["delta"]["content"]
                            if content:
                                bot_message += content
                                # Keep original Groq data but add our expected format
                                data["response"] = content
                                data["p"] = "abcdefghijklmnopqrstuvwxyz01234"
                                yield f"data: {json.dumps(data)}\n\n"
                except Exception as e:
                    logger.warning(f"Error processing Groq response: {e}")
                    continue

            # Send context data at the end
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
            return

    except Exception as e:
        logger.warning(f"Groq API error, falling back to default LLM: {e}")

    # Fall back to original LLM
    json_data = {
        "stream": "true",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "model": model,
    }

    async with http_async_client.stream(
        "POST",
        settings.LLM_URL,
        json=json_data,
    ) as response:
        response.raise_for_status()
        async for line in process_streaming(
            response=response,
            user_message=user_message,
            context=context,
            intent=intent,
        ):
            yield line


async def do_prompt_with_stream_simple(
    messages: list,
    temperature: float = 0.6,
    max_tokens: int = 256,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
):
    """Simple streaming prompt, with Groq fallback."""
    # Try Groq first
    try:
        async with http_async_client.stream(
            "POST",
            GROQ_API_URL,
            headers=GROQ_HEADERS,
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True,
            },
        ) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue

                json_str = line.removeprefix("data:").strip()
                if json_str == "[DONE]":
                    yield "data: [DONE]\n\n"
                    return

                try:
                    data = json.loads(json_str)
                    if "choices" in data and data["choices"]:
                        choice = data["choices"][0]

                        if choice.get("finish_reason") == "stop":
                            yield "data: [DONE]\n\n"
                            return

                        if "delta" in choice and "content" in choice["delta"]:
                            content = choice["delta"]["content"]
                            if content:
                                # Keep original Groq data but add our expected format
                                data["response"] = content
                                data["p"] = "abcdefghijklmnopqrstuvwxyz01234"
                                yield f"data: {json.dumps(data)}\n\n"
                except Exception:
                    continue

            yield "data: [DONE]\n\n"
            return
    except Exception as e:
        logger.warning(f"Groq API error in simple stream, falling back: {e}")

    # Fall back to original LLM
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

    except Exception as e:
        logger.error(f"Error in stream: {e}")
        yield f'data: {{"error": "An error occurred: {e}"}}\n\n'


async def do_prompt_no_stream(
    prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    system_prompt: str = None,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> dict:
    """Send a prompt to the LLM API without streaming. Try Groq first, fall back to original LLM."""
    messages = [
        {
            "role": "user",
            "content": f"{f'System: {system_prompt}. User Prompt: ' if system_prompt else ''} {prompt}",
        }
    ]

    # Try Groq first
    try:
        response = await http_async_client.post(
            GROQ_API_URL,
            headers=GROQ_HEADERS,
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()

        data = response.json()
        if "choices" in data and data["choices"]:
            content = data["choices"][0]["message"]["content"]
            # Keep Groq data but add our expected format
            data["response"] = content
            data["p"] = "abcdefghijklmnopqrstuvwxyz01234"
            return data
    except Exception as e:
        logger.warning(f"Groq API error, falling back: {e}")

    # Fall back to original LLM
    return await make_llm_request(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": messages,
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
    """Send a prompt to the LLM API without streaming, using synchronous client. Try Groq first, fall back to original LLM."""
    messages = [
        {
            "role": "user",
            "content": f"{f'System: {system_prompt}. User Prompt: ' if system_prompt else ''} {prompt}",
        }
    ]

    # Try Groq first
    try:
        response = http_sync_client.post(
            GROQ_API_URL,
            headers=GROQ_HEADERS,
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()

        data = response.json()
        if "choices" in data and data["choices"]:
            content = data["choices"][0]["message"]["content"]
            # Keep Groq data but add our expected format
            data["response"] = content
            data["p"] = "abcdefghijklmnopqrstuvwxyz01234"
            return data
    except Exception as e:
        logger.warning(f"Groq API error, falling back: {e}")

    # Fall back to original LLM
    return make_llm_request_sync(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": messages,
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

    result = await do_prompt_no_stream(
        prompt=prompt, system_prompt=CALENDAR_EVENT_CREATOR, max_tokens=4096
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
