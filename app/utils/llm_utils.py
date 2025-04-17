import json
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, List, Optional

import httpx
from openai import AsyncOpenAI, OpenAI

from app.config.loggers import llm_logger as logger
from app.config.settings import settings
from app.prompts.system.calendar_prompts import CALENDAR_EVENT_CREATOR
from app.prompts.system.general import MAIN_SYSTEM_PROMPT
from app.utils.langchain_utils_temp import GROQ_MODEL, prepare_messages

http_async_client = httpx.AsyncClient(timeout=1000000)
http_sync_client = httpx.Client(timeout=1000000)

# Create OpenAI clients (configured to use Groq API)
async_openai_client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1", api_key=settings.GROQ_API_KEY
)

sync_openai_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.GROQ_API_KEY,
)


async def call_groq_api_stream(
    messages: List[Dict], temperature: float, max_tokens: int
) -> AsyncGenerator[Dict, None]:
    """Call Groq API with streaming enabled using OpenAI library."""
    try:
        stream = await async_openai_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices and len(chunk.choices) > 0:
                choice = chunk.choices[0]

                if choice.finish_reason == "stop":
                    break

                if choice.delta.content:
                    data = {
                        "response": choice.delta.content,
                        "p": "abcdefghijklmnopqrstuvwxyz01234",
                    }
                    yield data
    except Exception as e:
        logger.warning(f"Error in OpenAI streaming call to Groq: {e}")
        raise


async def call_groq_api(
    messages: List[Dict], temperature: float, max_tokens: int
) -> Dict:
    """Call Groq API without streaming using OpenAI library."""
    try:
        response = await async_openai_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            # Format the response to match the expected structure
            data = {
                "response": content,
                "p": "abcdefghijklmnopqrstuvwxyz01234",
                "choices": [{"message": {"content": content}}],
            }
            return data
        return {"error": "No choices in response"}
    except Exception as e:
        logger.warning(f"Error in OpenAI call to Groq: {e}")
        raise


def call_groq_api_sync(
    messages: List[Dict], temperature: float, max_tokens: int
) -> Dict:
    """Call Groq API synchronously without streaming using OpenAI library."""
    try:
        response = sync_openai_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content
            # Format the response to match the expected structure
            data = {
                "response": content,
                "p": "abcdefghijklmnopqrstuvwxyz01234",
                "choices": [{"message": {"content": content}}],
            }
            return data
        return {"error": "No choices in response"}
    except Exception as e:
        logger.warning(f"Error in OpenAI sync call to Groq: {e}")
        raise


async def do_prompt_with_stream_simple(
    messages: list,
    temperature: float = 0.6,
    max_tokens: int = 256,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
    system_prompt: str = MAIN_SYSTEM_PROMPT,
):
    """Simple streaming prompt, with Groq fallback."""
    groq_messages = prepare_messages(messages, system_prompt)

    try:
        async for data in call_groq_api_stream(groq_messages, temperature, max_tokens):
            yield f"data: {json.dumps(data)}\n\n"

        yield "data: [DONE]\n\n"
        return
    except Exception as e:
        logger.warning(f"Groq API error in simple stream, falling back: {e}")

    # Use processed messages for consistency with Groq
    processed_messages = prepare_messages(messages, system_prompt)
    json_data = {
        "stream": "true",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": processed_messages,
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
    system_prompt: str = MAIN_SYSTEM_PROMPT,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> dict:
    """Send a prompt to the LLM API without streaming. Try Groq first, fall back to original LLM."""
    messages = [{"role": "user", "content": prompt}]
    groq_messages = prepare_messages(messages, system_prompt)

    try:
        return await call_groq_api(groq_messages, temperature, max_tokens)
    except Exception as e:
        logger.warning(f"Groq API error, falling back: {e}")

    # Use processed messages for consistency with Groq
    processed_messages = prepare_messages(messages, system_prompt)
    return await make_llm_request(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": processed_messages,
        },
        http_async_client,
    )


def do_prompt_no_stream_sync(
    prompt: str,
    temperature: float = 0.6,
    max_tokens: int = 1024,
    system_prompt: Optional[str] = None,
    model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
) -> dict:
    """Send a prompt to the LLM API without streaming, using synchronous client. Try Groq first, fall back to original LLM."""
    messages = [{"role": "user", "content": prompt}]
    groq_messages = prepare_messages(messages, system_prompt)

    try:
        return call_groq_api_sync(groq_messages, temperature, max_tokens)
    except Exception as e:
        logger.warning(f"Groq API error, falling back: {e}")

    # Use processed messages for consistency with Groq
    processed_messages = prepare_messages(messages, system_prompt)
    return make_llm_request_sync(
        {
            "stream": "false",
            "temperature": temperature,
            "max_tokens": max_tokens,
            "model": model,
            "messages": processed_messages,
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
                # Extract user_id and access_token from context if available
                user_id = context.get("user_id")
                access_token = context.get("access_token")
                success, options = await process_calendar_event(
                    user_message, bot_message, user_id, access_token
                )
                if success:
                    yield f"data: {json.dumps({'intent': 'calendar', 'calendar_options': options})}\n\n"
            yield "data: [DONE]\n\n"
            break
        bot_message += json.loads(content).get("response", "")
        yield line + "\n\n"


async def process_calendar_event(
    message: str,
    bot_message: str = "",
    user_id: Optional[str] = None,
    access_token: Optional[str] = None,
):
    """Create a calendar event using the LLM."""
    now = datetime.now(timezone.utc)

    # Base prompt with current date/time context
    prompt = (
        f"This is the user message: {message}. The current date and time is: {now.isoformat()}. "
        f"Today's day is {now.strftime('%A')}. This is the assistant's message: {bot_message}"
    )

    # Add calendar information if available
    calendar_info = ""
    if user_id and access_token:
        try:
            from app.services.calendar_service import (
                fetch_calendar_list,
                get_user_calendar_preferences,
            )

            # Get list of calendars
            calendar_data = await fetch_calendar_list(access_token)
            calendars = calendar_data.get("items", [])

            # Get user preferences for selected calendars
            try:
                preferences = await get_user_calendar_preferences(user_id)
                selected_calendars = preferences.get("selectedCalendars", [])
            except Exception:
                # If no preferences, default to primary calendar
                primary_calendar = next(
                    (cal for cal in calendars if cal.get("primary")), None
                )
                selected_calendars = (
                    [primary_calendar["id"]] if primary_calendar else []
                )

            # Format calendar information for the prompt
            calendar_list = []
            for cal in calendars:
                is_selected = cal["id"] in selected_calendars
                calendar_list.append(
                    f"{cal['summary']} (ID: {cal['id']}, {'Selected' if is_selected else 'Not Selected'})"
                )

            if calendar_list:
                calendar_info = "\n\nAvailable calendars:\n" + "\n".join(calendar_list)
        except Exception as e:
            logger.error(f"Error fetching calendar information: {e}")

    # Add calendar info to prompt if available
    if calendar_info:
        prompt += calendar_info

    result = await do_prompt_no_stream(
        prompt=prompt, system_prompt=CALENDAR_EVENT_CREATOR, max_tokens=4096
    )

    if isinstance(result, dict) and result.get("response"):
        try:
            parsed_result = json.loads(result["response"])
            if parsed_result.get("intent") == "calendar" and parsed_result.get(
                "calendar_options"
            ):
                return True, parsed_result["calendar_options"]
        except Exception:
            return False, None
    return False, None
