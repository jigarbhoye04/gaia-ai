# app/services/llm_service.py
import asyncio
import json
from datetime import datetime, timezone

import httpx
from groq import AsyncGroq

from app.utils.logging_util import get_logger
from app.config.settings import settings

logger = get_logger(name="llm", log_file="llm.log")


class LLMService:
    """
    Service class to handle interactions with various LLM APIs.
    """

    def __init__(self):
        """
        Initialize the LLMService with necessary configurations and HTTP clients.
        """
        self.llm_url = settings.LLM_URL
        self.http_async_client = httpx.AsyncClient(timeout=1000000.0)
        # Retaining the original parameter for compatibility.
        self.http_async_client2 = httpx.AsyncClient(http2=2, timeout=1000000.0)
        self.ACCOUNT_ID = settings.CLOUDFLARE_ACCOUNTID
        self.AUTH_TOKEN = settings.CLOUDFLARE_AUTH_TOKEN
        self.features = [
            "Generate images",
            "Analyze & understand uploaded documents & images from the user",
            "You are not only a text-based LLM",
            "Schedule calendar events (Coming Soon)",
            "Provide personalized suggestions (Coming Soon)",
            "Manage files on Google Drive (Coming Soon)",
        ]
        self.groq_api_key = settings.GROQ_API_KEY
        self.groq_client = AsyncGroq(api_key=self.groq_api_key)

    async def do_prompt_no_stream(
        self,
        prompt: str,
        temperature: float = 0.6,
        max_tokens: int = 1024,
        system_prompt: str = "",
        model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
    ) -> dict:
        """
        Send a prompt to the LLM API without streaming.
        """

        try:
            response = await self.http_async_client.post(
                self.llm_url,
                json={
                    "stream": "false",
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "model": model,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"System: {system_prompt} User Prompt: {prompt}",
                        },
                        # {"role": "system", "content": system_prompt},
                        # {"role": "user", "content": prompt},
                    ],
                },
            )
            response.raise_for_status()

            if response.status_code == 200:
                try:
                    response_dict = response.json()
                    return response_dict
                except ValueError as ve:
                    logger.error(f"Error parsing JSON: {ve}")
                    return {"error": "Invalid JSON response"}
            else:
                logger.error(f"Unexpected status code: {response.status_code}")
                return {"error": "Unexpected status code"}

        except httpx.RequestError as e:
            logger.error(f"Request error: {e}")
            return {"error": str(e)}

    async def do_prompt_with_stream(
        self,
        messages: list,
        temperature: float = 0.6,
        max_tokens: int = 256,
        model: str = "@cf/meta/llama-3.1-8b-instruct-fast",
        intent=None,
    ):
        """
        Send a prompt to the LLM API with streaming enabled.
        """
        # Extract user message for calendar processing if needed.
        user_message = ""
        if intent == "calendar":
            for msg in reversed(messages):
                if msg.get("role") == "user" and msg.get("content"):
                    user_message = msg.get("content")
                    break

        json_data = {
            "stream": "true",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
            "model": model,
        }

        bot_message = ""
        success = False
        calendar_options = None

        try:
            async with self.http_async_client.stream(
                "POST", self.llm_url, json=json_data
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue

                    # Remove "data:" prefix if present
                    content = (
                        line[len("data:") :].strip()
                        if line.startswith("data:")
                        else line
                    )
                    print(content)

                    if content == "[DONE]":
                        if intent == "calendar":
                            user_message = ""
                            for msg in reversed(messages):
                                if msg.get("role") == "user" and msg.get("content"):
                                    user_message = msg.get("content")
                                    break

                            success, calendar_options = await llm_create_calendar_event(
                                message=user_message, bot_message=bot_message
                            )
                            print("Calendar options:", calendar_options)

                        if success:
                            event_json = {
                                "intent": "calendar",
                                "calendar_options": calendar_options,
                            }
                            yield f"data: {json.dumps(event_json)}\n\n"
                        # else:
                        #     yield 'data: {"error": "Could not create calendar event."}\n\n'
                        yield "data: [DONE]\n\n"
                        break  # Exit the loop to avoid reading from a closed stream

                    try:
                        data = json.loads(content)
                        bot_message += data.get("response", "")
                    except json.JSONDecodeError as e:
                        print("JSON decode error:", e, content)
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

    # async def do_prompt_groq(
    #     self,
    #     messages,
    #     model: str = "llama-3.3-70b-versatile",
    #     max_tokens: int = 1024,
    #     temperature: float = 0.5,
    #     stream: bool = False,
    # ):
    #     """
    #     Send a chat completion request to the GROQ API with optional streaming.
    #     """
    #     try:
    #         response = await self.groq_client.chat.completions.create(
    #             messages=messages,
    #             model=model,
    #             temperature=temperature,
    #             max_completion_tokens=max_tokens,
    #             stream=stream,
    #         )
    #         if stream:
    #             async for chunk in response:
    #                 content = chunk.choices[0].delta.content
    #                 if content:
    #                     yield f"data: {content}\n\n"
    #         else:
    #             content = response.choices[0].message["content"]
    #             yield f"data: {content}\n\n"
    #     except Exception as e:
    #         yield f"data: An unexpected error occurred: {e}\n"
    #     finally:
    #         yield "data: [DONE]\n\n"


async def llm_create_calendar_event(message: str, bot_message: str = ""):
    """
    Create a calendar event using the LLM.
    Returns a tuple:
      (success_flag, calendar_options)
    where calendar_options can be either a single event dict or an array of event dicts.
    """
    try:
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        current_day = now.strftime("%A")

        # Call the non-streaming prompt and wait for the result.
        result = await asyncio.wait_for(
            llm_service.do_prompt_no_stream(
                prompt=f"This is the user message: {message}. The current date and time is: {now_iso}. Today's day is {current_day}. This is the assistant's message: {bot_message}",
                system_prompt="""
                You are an intelligent assistant specialized in creating calendar events. You are provided with a user message and the current date and time. Your task is to analyze both and produce a JSON object describing calendar event(s) accordingly.
                Output a single-line JSON object exactly in the following format with no additional text or formatting:
                {"intent": "calendar", "calendar_options": <event_data>}
                Where <event_data> must be either a single event object or an array of event objects. Each event object must have exactly these four keys: "summary", "description", "start", and "end". The "start" and "end" values must be valid ISO 8601 formatted datetime strings.
                Strict rules:
                1. Output only one JSON object on a single line.
                2. The "intent" field must be exactly "calendar".
                3. If multiple events are relevant, "calendar_options" must be an array; otherwise, it can be a single object.
                4. Do not include any extra text, line breaks, or commentary.
                """,
                max_tokens=4096,
            ),
            timeout=30,  # Timeout after 30 seconds if no response.
        )

        # Normalize the result to a dictionary.
        if isinstance(result, dict):
            parsed_result = result
        elif isinstance(result, str) and result.strip():
            try:
                parsed_result = json.loads(result.strip())
            except json.JSONDecodeError as e:
                print("JSON decode error:", e)
                return False, None
        else:
            print("Result is empty or not a valid string.")
            return False, None

        print("Parsed result:", parsed_result)

        # If the result has a nested "response" key, try to parse it.
        if "response" in parsed_result and isinstance(parsed_result["response"], str):
            try:
                parsed_inner = json.loads(parsed_result["response"])
                parsed_result = parsed_inner
            except json.JSONDecodeError as e:
                print("Nested JSON decode error:", e)
                return False, None

        # Verify the intent.
        if parsed_result.get("intent") == "calendar":
            options = parsed_result.get("calendar_options", None)
            if options is None:
                print("No calendar_options found.")
                return False, None
            # Return options as is – it might be a dict (single event) or a list (multiple events)
            return True, options
        else:
            print("Intent mismatch or missing.")
            return False, None
    except asyncio.TimeoutError:
        print("LLM call timed out")
        return (False, None)
    except Exception as e:
        print("Exception in llm_create_calendar_event:", e)
        return (False, None)


# Instantiate the service once and export it as a singleton.
llm_service = LLMService()
