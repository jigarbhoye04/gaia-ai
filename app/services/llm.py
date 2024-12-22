import requests
import os
import asyncio
import logging
from dotenv import load_dotenv
import httpx

logging.basicConfig(level=logging.INFO)
http_async_client = httpx.AsyncClient(timeout=1000000.0)


load_dotenv()
system_prompt: str = """You are an Assistant who's name is GAIA - a general purpose artificial intelligence assistant. Your responses should be concise and clear If you're asked who created you then you were created by Aryan Randeriya. Your responses should be concise and to the point. If you do not know something, be clear that you do not know it. You can setup calendar events, manage your files on google drive, assist in every day tasks and more!"""

url = "https://llm.aryanranderiya1478.workers.dev/"

features = [
    "Generate images",
    "Analyse & understand uploaded documents & images from the user",
    "You are not only a text based llm",
    "Scedule calendar events (Coming Soon)",
    "Provide personalised suggestions (Coming Soon)",
    "Manage files on Google Drive (Coming Soon)",
]

ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNTID")
AUTH_TOKEN = os.environ.get("CLOUDFLARE_AUTH_TOKEN")


def doPrompt(prompt: str, temperature=0.6, max_tokens=256):
    response = requests.post(
        url,
        json={
            "prompt": prompt,
            "stream": "true",
            "temperature": temperature,
            "max_tokens": max_tokens,
        },
        #   stream=True
    )

    if response.status_code == 200:
        for line in response.iter_lines():
            if line:
                print(line)
                yield line.decode("utf-8") + "\n\n"
    else:
        yield "data: Error: Failed to fetch data\n\n"


def doPromptNoStream(prompt: str, temperature=0.6, max_tokens=256):
    try:
        response = requests.post(
            url,
            json={
                "prompt": prompt,
                "stream": "false",
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        response.raise_for_status()

        if response.status_code == 200:
            try:
                response_dict = response.json()
                return response_dict
            except ValueError as ve:
                print(f"Error parsing JSON: {ve}")
                return {"error": "Invalid JSON response"}
        else:
            print(f"Unexpected status code: {response.status_code}")
            return {"error": "Unexpected status code"}

    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return {"error": str(e)}


async def doPromptNoStreamAsync(prompt: str, temperature=0.6, max_tokens=256):
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


async def doPromptWithStreamAsync(prompt: str, temperature=0.6, max_tokens=256):
    json_data = {
        "stream": "true",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "prompt": prompt,
    }

    try:
        async with http_async_client.stream("POST", url, json=json_data) as response:
            response.raise_for_status()

            async for line in response.aiter_lines():
                if line.strip():
                    print(f"Received: {line}")
                    # yield line.decode("utf-8") + "\n\n"
                    yield line + "\n\n"
    except httpx.StreamError as e:
        print(f"Stream error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
