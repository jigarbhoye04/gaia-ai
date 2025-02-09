# app/services/llm_service.py
import os
import asyncio
import httpx
import json
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
                    "messages": [{"role": "user", "content": prompt}],
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
                    if line.strip():
                        logger.debug(f"Stream line: {line}")
                        if line == "data: [DONE]":
                            # Yield any additional required data, then mark the stream as done.
                            yield f"""data: {
                                json.dumps(
                                    {
                                        "intent": "calendar",
                                        "calendar_options": {
                                            "title": "test_title",
                                            "description": "test_description",
                                            "date": "2025-02-08T19:34:52.906Z",
                                        },
                                    }
                                )
                            }\n\n"""
                            yield "data: [DONE]\n\n"
                        else:
                            yield line + "\n\n"
        except httpx.StreamError as e:
            logger.error(f"Stream error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")

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


# Instantiate the service once and export it as a singleton
llm_service = LLMService()
