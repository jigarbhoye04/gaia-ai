import os
import asyncio
import logging
from dotenv import load_dotenv
import httpx
from groq import AsyncGroq
from app.utils.logging import get_logger

logger = get_logger(name="llm", log_file="llm.log")

http_async_client = httpx.AsyncClient(timeout=1000000.0)
http_async_client2 = httpx.AsyncClient(http2=2, timeout=1000000.0)

load_dotenv()

system_prompt: str = """You are an Assistant who's name is GAIA - a general-purpose artificial intelligence assistant. Your responses should be concise and clear. If you're asked who created you then you were created by Aryan Randeriya. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on Google Drive, assist in everyday tasks, and more!"""

url = "https://llm.aryanranderiya1478.workers.dev/"

features = [
    "Generate images",
    "Analyze & understand uploaded documents & images from the user",
    "You are not only a text-based LLM",
    "Schedule calendar events (Coming Soon)",
    "Provide personalized suggestions (Coming Soon)",
    "Manage files on Google Drive (Coming Soon)",
]

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNTID")
AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = AsyncGroq(api_key=GROQ_API_KEY)


async def doPromptNoStream(
    prompt: str,
    temperature=0.6,
    max_tokens=256,
    model="@cf/meta/llama-3.1-8b-instruct-fast",
):
    """
    Asynchronous function to send a prompt to the LLM API without streaming.

    Args:
        prompt (str): The prompt to send.
        temperature (float): Sampling temperature for the response.
        max_tokens (int): Maximum tokens for the response.

    Returns:
        dict: Parsed JSON response or an error message.
    """
    try:
        response = await http_async_client.post(
            url,
            json={
                "stream": "false",
                "temperature": temperature,
                "max_tokens": max_tokens,
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt},
                ],
            },
        )
        response.raise_for_status()

        if response.status_code == 200:
            try:
                response_dict = response.json()
                return response_dict
            except ValueError as ve:
                logging.error(f"Error parsing JSON: {ve}")
                return {"error": "Invalid JSON response"}
        else:
            logging.error(f"Unexpected status code: {response.status_code}")
            return {"error": "Unexpected status code"}

    except httpx.RequestError as e:
        logging.error(f"Request error: {e}")
        return {"error": str(e)}


async def doPromptCloudflareSDK(prompt: str, temperature=0.6, max_tokens=256):
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct"
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    json_data = {
        "max_tokens": max_tokens,
        temperature: temperature,
        "messages": [
            {
                "role": "system",
                "content": f"""
                You are GAIA - a fun general-purpose artificial intelligence assistant.
                Your responses should be concise and clear.
                If you're asked who created you, then you were created by Aryan Randeriya,
                but no need to mention it without reason.
                Your responses should be concise and to the point.
                   If you do not know something, be clear that you do not know it.
                You can do these features: ${", ".join(features)}, and more!
                if provided with code, you must not give fake code, you must explain the code, you must provide extensive comments too.
                """,
            },
            {"role": "user", "content": prompt},
        ],
    }

    try:
        response = await http_async_client.post(url, json=json_data, headers=headers)
        response.raise_for_status()

        result = response.json()
        print("this is the result xxx", result)
        response = result.get("result", {}).get("response", [])
        return response[0] if response else "{}"

    except ValueError:
        print("Error: Response is not valid JSON.")
        return "{}"
    except httpx.HTTPStatusError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return "{}"
    except httpx.RequestError as req_err:
        print(f"Error during request: {req_err}")
        return "{}"
    except asyncio.TimeoutError:
        print("Request timed out.")
        return "{}"
    except Exception as err:
        print(f"An unexpected error occurred: {err}")
        return "{}"


async def doPrompWithStream(
    messages=[],
    temperature=0.6,
    max_tokens=256,
    model="@cf/meta/llama-3.1-8b-instruct-fast",
    intent=None,
):
    """
    Asynchronous function to send a prompt to the LLM API with streaming.

    Args:
        messages (list): List of message objects for the LLM.
        temperature (float): Sampling temperature for the response.
        max_tokens (int): Maximum tokens for the response.

    Yields:
        str: Lines of the response from the server.
    """
    json_data = {
        "stream": "true",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "model": model,
        # "messages": [{"role": "user", "content": "my name is aryan"}],
        # [{"role": "user", "content": "my name is aryan"},{"role": "user", "content": "what is my name?"}]}
    }
    try:
        async with http_async_client.stream("POST", url, json=json_data) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if line.strip():
                    yield line + "\n\n"

    except httpx.StreamError as e:
        logging.error(f"Stream error: {e}")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")


async def doPromptGROQ(
    messages,
    model="llama-3.3-70b-versatile",
    max_tokens=1024,
    temperature=0.5,
    stream=False,  # Added argument to control streaming
):
    """
    Sends a chat completion request to the GROQ API with optional streaming enabled using the Groq client library.

    Args:
        messages (list[dict]): A list of messages with roles (e.g., user/system) and content.
        model (str): The model to use for chat completion (default is "llama-3.3-70b-versatile").
        max_tokens (int): The maximum number of tokens to generate in the response.
        temperature (float): Sampling temperature, determines randomness of the response.
        stream (bool): Whether to stream the response or return the full response once completed.

    Yields:
        str: Chunks of the streamed response from the GROQ API (if stream=True), or full response (if stream=False).
    """
    try:
        response = await client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=temperature,
            max_completion_tokens=max_tokens,
            stream=stream,
        )

        # If streaming, yield chunks as they arrive
        if stream:
            async for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {content}\n\n"
        else:
            # For non-streaming, return the full response after completion
            content = response.choices[0].message["content"]
            yield f"data: {content}\n\n"

    except Exception as e:
        yield f"data: An unexpected error occurred: {e}\n"

    finally:
        yield "data: [DONE]\n\n"  # End of response
