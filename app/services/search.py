import os
import httpx
from dotenv import load_dotenv
from bs4 import BeautifulSoup

# import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords

# Load environment variables from a .env file
load_dotenv()

# Get the Bing API subscription key from the environment variable
subscription_key = os.getenv("BING_API_KEY_1")
if not subscription_key:
    raise EnvironmentError("Missing BING_SUBSCRIPTION_KEY environment variable.")

# Bing Search API endpoint
search_url = "https://api.bing.microsoft.com/v7.0/search"

# nltk.download("punkt")
# nltk.download("stopwords")
# nltk.download("punkt_tab")

http_async_client = httpx.AsyncClient()


async def perform_search(query: str):
    """
    Perform a search request using Bing Search API and extract useful information.

    Args:
        query (str): The search query.

    Returns:
        list: Extracted useful information from the search results.
    """
    headers = {"Ocp-Apim-Subscription-Key": subscription_key}
    params = {
        "q": query,
        "count": 7,
        # "freshness": "day",
        # "responseFilter": "-images,-videos",
        # "safeSearch":""
    }

    try:
        response = await http_async_client.get(
            search_url, headers=headers, params=params
        )
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()  # Parse the JSON response
        print(data)
        # Extract useful information
        results = []
        for item in data.get("webPages", {}).get("value", []):
            results.append(
                {
                    "title": item.get("name"),
                    "siteName": item.get("siteName"),
                    "url": item.get("url"),
                    "snippet": item.get("snippet"),
                    "dateLastCrawled": item.get("dateLastCrawled"),
                }
            )

        return results

    except httpx.HTTPStatusError as http_err:
        return {"error": f"HTTP error occurred: {http_err}"}
    except httpx.RequestError as req_err:
        return {"error": f"Request error occurred: {req_err}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}


async def perform_fetch(url: str):
    try:
        # Send HTTP request and get the response
        response = await http_async_client.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove all script and style elements
        for script in soup(["script", "style"]):
            script.decompose()

        # Get the text from the HTML content
        text = soup.get_text()

        # Break the text into lines and remove leading and trailing whitespace
        lines = (line.strip() for line in text.splitlines())

        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))

        # Drop blank lines
        text = "\n".join(chunk for chunk in chunks if chunk)

        # Convert to lowercase
        text = text.lower()

        # Remove special characters and numbers
        # text = re.sub(r"[^a-zA-Z\s]", "", text)

        # Tokenize the text
        tokens = word_tokenize(text)

        # Remove stopwords
        stop_words = set(stopwords.words("english"))
        tokens = [word for word in tokens if word not in stop_words]

        # Join the tokens back into a string
        preprocessed_text = " ".join(tokens)

        print(preprocessed_text)
        return preprocessed_text

    except httpx.HTTPStatusError as http_err:
        error = f"HTTP error occurred: {http_err}"
        print(error)
        return error
    except httpx.RequestError as req_err:
        error = f"HTTP Request error occurred: {req_err}"
        print(error)
        return error
    except Exception as e:
        error = f"An unexpected error occurred: {e}"
        print(error)
        return error


if __name__ == "__main__":
    import asyncio

    async def main():
        query = "what is the weather in surat?"
        result = await perform_search(query)
        for entry in result:
            print(entry)

    asyncio.run(main())
