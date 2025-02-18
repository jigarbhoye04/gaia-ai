# app/services/llm_service.py
import asyncio
import json
import os
from datetime import datetime, timezone

import httpx

# import pytz
from dotenv import load_dotenv
from groq import AsyncGroq

from app.utils.logging_util import get_logger

# Load environment variables
load_dotenv()

logger = get_logger(name="llm", log_file="llm.log")


class LLMService:
    """
    Service class to handle interactions with various LLM APIs.
    """

    def __init__(self):
        """
        Initialize the LLMService with necessary configurations and HTTP clients.
        """
        self.llm_url = "https://llm.aryanranderiya1478.workers.dev/"
        self.http_async_client = httpx.AsyncClient(timeout=1000000.0)
        # Retaining the original parameter for compatibility.
        self.http_async_client2 = httpx.AsyncClient(http2=2, timeout=1000000.0)
        self.ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNTID")
        self.AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")
        self.features = [
            "Generate images",
            "Analyze & understand uploaded documents & images from the user",
            "You are not only a text-based LLM",
            "Schedule calendar events (Coming Soon)",
            "Provide personalized suggestions (Coming Soon)",
            "Manage files on Google Drive (Coming Soon)",
        ]
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_client = AsyncGroq(api_key=self.groq_api_key)

    async def do_prompt_no_stream(
        self,
        prompt: str,
        temperature: float = 0.6,
        max_tokens: int = 256,
        system_prompt: str = None,
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

    async def do_prompt_cloudflare_sdk(
        self,
        prompt: str,
        temperature: float = 0.6,
        max_tokens: int = 256,
        system_prompt: str = None,
        model: str = "@cf/meta/llama-3-8b-instruct",
    ) -> str:
        """
        Send a prompt using the Cloudflare SDK.
        """
        if system_prompt is None:
            system_prompt = f"""
            You are GAIA - a fun general-purpose artificial intelligence assistant.
            Your responses should be concise and clear.
            If you're asked who created you, then you were created by Aryan Randeriya,
            but no need to mention it without reason.
            Your responses should be concise and to the point.
            If you do not know something, be clear that you do not know it.
            You can do these features: {", ".join(self.features)}, and more!
            if provided with code, you must not give fake code, you must explain the code, you must provide extensive comments too.
            """
        url = f"https://api.cloudflare.com/client/v4/accounts/{self.ACCOUNT_ID}/ai/run/{model}"
        headers = {"Authorization": f"Bearer {self.AUTH_TOKEN}"}
        json_data = {
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        }
        try:
            response = await self.http_async_client.post(
                url, json=json_data, headers=headers
            )
            response.raise_for_status()
            result = response.json()
            response_content = result.get("result", {}).get("response", [])
            return response_content if response_content else "{}"
        except ValueError:
            logger.error("Error: Response is not valid JSON.")
            return "{}"
        except httpx.HTTPStatusError as http_err:
            logger.error(f"HTTP error occurred: {http_err}")
            return "{}"
        except httpx.RequestError as req_err:
            logger.error(f"Error during request: {req_err}")
            return "{}"
        except asyncio.TimeoutError:
            logger.error("Request timed out.")
            return "{}"
        except Exception as err:
            logger.error(f"An unexpected error occurred: {err}")
            return "{}"

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
        # Extract user message for calendar processing upfront if needed
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

        try:
            async with self.http_async_client.stream(
                "POST", self.llm_url, json=json_data
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue

                    if line == "data: [DONE]":
                        if intent == "calendar":
                            # await self._handle_calendar_intent(user_message)
                            user_message = ""
                            for msg in reversed(messages):
                                if msg.get("role") == "user" and msg.get("content"):
                                    user_message = msg.get("content")
                                    break

                            (
                                success,
                                start,
                                end,
                                summary,
                                description,
                            ) = await llm_create_calendar_event(message=user_message)

                            print(start, end, summary, description)

                        if success:
                            event_json = {
                                "intent": "calendar",
                                "calendar_options": {
                                    "summary": summary,
                                    "description": description,
                                    "start": start,
                                    "end": end,
                                },
                            }
                            yield f"data: {json.dumps(event_json)}\n\n"
                        else:
                            yield 'data: {"error": "Could not create calendar event."}\n\n'

                        yield "data: [DONE]\n\n"
                    else:
                        yield line + "\n\n"

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error {e.response.status_code}: {e}")
            yield f'data: {{"error": "HTTP error: {e.response.status_code}"}}\n\n'
        except httpx.StreamError as e:
            logger.error(f"Stream error: {e}")
            yield f'data: {{"error": "Stream error occurred : {e}"}}\n\n'
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            yield f'data: {{"error": "An unexpected error occurred: {e}"}}\n\n'

    async def do_prompt_groq(
        self,
        messages,
        model: str = "llama-3.3-70b-versatile",
        max_tokens: int = 1024,
        temperature: float = 0.5,
        stream: bool = False,
    ):
        """
        Send a chat completion request to the GROQ API with optional streaming.
        """
        try:
            response = await self.groq_client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=temperature,
                max_completion_tokens=max_tokens,
                stream=stream,
            )
            if stream:
                async for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield f"data: {content}\n\n"
            else:
                content = response.choices[0].message["content"]
                yield f"data: {content}\n\n"
        except Exception as e:
            yield f"data: An unexpected error occurred: {e}\n"
        finally:
            yield "data: [DONE]\n\n"


async def llm_create_calendar_event(message: str):
    """
    Create a calendar event using the LLM.
    Returns a tuple:
      (success_flag, start, end, summary, description)
    """
    try:
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        current_day = now.strftime("%A")

        # Call the non-streaming prompt and wait for the result.
        result = await asyncio.wait_for(
            llm_service.do_prompt_no_stream(
                prompt=f"This is the user message: {message}. The current date and time is: {now_iso}. Today's day is {current_day}",
                model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                system_prompt="""
                You are an intelligent assistant specialized in creating calendar events. You are provided with a user message and the current date and time. Your task is to analyze both and produce a JSON object that describes a calendar event accordingly. The JSON must follow the exact format below and include no additional text or markdown formatting:
                {"intent": "calendar", "calendar_options": {"summary": "<event summary>", "description": "<event description>", "start": "<ISO 8601 start datetime>", "end": "<ISO 8601 end datetime>"}}
                Strict rules:
                1. Output only the JSON object in a single line with no line breaks.
                2. The "intent" field must be exactly "calendar".
                3. The "calendar_options" object must include exactly four keys: "summary", "description", "start", and "end".
                4. The "start" and "end" values must be valid ISO 8601 formatted datetime strings.
                5. Use both the provided user message and the current date and time to determine appropriate event details.
                6. Do not include any additional text, commentary, or formatting.
                """,
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
                return (False, None, None, None, None)
        else:
            print("Result is empty or not a valid string.")
            return (False, None, None, None, None)

        print("Parsed result:", parsed_result)

        # Check if the result contains a "response" key.
        if "response" in parsed_result and isinstance(parsed_result["response"], str):
            try:
                # Parse the nested JSON string from the "response" key.
                parsed_inner = json.loads(parsed_result["response"])
                parsed_result = parsed_inner
            except json.JSONDecodeError as e:
                print("Nested JSON decode error:", e)
                return (False, None, None, None, None)

        # Check that the intent is as expected.
        if parsed_result.get("intent") == "calendar":
            options = parsed_result.get("calendar_options", {})
            return (
                True,
                options.get("start"),
                options.get("end"),
                options.get("summary"),
                options.get("description"),
            )
        else:
            print("Intent mismatch or missing.")
            return (False, None, None, None, None)
    except asyncio.TimeoutError:
        print("LLM call timed out")
        return (False, None, None, None, None)
    except Exception as e:
        print("Exception in llm_create_calendar_event:", e)
        return (False, None, None, None, None)


# Instantiate the service once and export it as a singleton.
llm_service = LLMService()
