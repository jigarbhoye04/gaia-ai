import asyncio

import html2text
import httpx
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

from app.config.loggers import search_logger as logger
from app.config.settings import settings

subscription_key = settings.BING_API_KEY_1
search_url = settings.BING_SEARCH_URL

if not subscription_key:
    raise EnvironmentError("Missing BING_SUBSCRIPTION_KEY environment variable.")


http_async_client = httpx.AsyncClient()


WEB_SEARCH_URL = "https://api.bing.microsoft.com/v7.0/search"
IMAGE_SEARCH_URL = "https://api.bing.microsoft.com/v7.0/images/search"
NEWS_SEARCH_URL = "https://api.bing.microsoft.com/v7.0/news/search"
VIDEO_SEARCH_URL = "https://api.bing.microsoft.com/v7.0/videos/search"

MAX_QUERY_LENGTH = 1500


async def fetch_endpoint(
    url: str, query: str, count: int, extra_params: dict = None
) -> dict:
    """
    Generic function to call a Bing API endpoint.

    Args:
        url: The API endpoint.
        query: The search query.
        count: Number of results to return.
        subscription_key: API subscription key.
        extra_params: Additional query parameters, if needed.

    Returns:
        The JSON response as a dictionary, or an empty dict on error.
    """
    headers = {"Ocp-Apim-Subscription-Key": subscription_key}
    params = {"q": query, "count": count}
    if extra_params:
        params.update(extra_params)

    try:
        response = await http_async_client.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as http_err:
        logger.error(f"HTTP error from {url}: {http_err}")
    except httpx.RequestError as req_err:
        logger.error(f"Request error from {url}: {req_err}")
    except Exception as e:
        logger.error(f"Unexpected error from {url}: {e}")
    return {}


# --- Merge Modules ---
def merge_web_results(data: dict) -> list:
    """Extract and merge web search results."""
    return [
        {
            "title": item.get("name", "No Title"),
            "url": item.get("url", "#"),
            "snippet": item.get("snippet", ""),
            "source": item.get("displayUrl", "Unknown"),
            "date": item.get("dateLastCrawled"),
        }
        for item in data.get("webPages", {}).get("value", [])
    ]


def merge_image_results(data: dict) -> list:
    """Extract and merge image search results."""
    return [
        {
            "title": item.get("name", "No Title"),
            "url": item.get("contentUrl", "#"),
            "thumbnail": item.get("thumbnailUrl", ""),
            "source": item.get("hostPageUrl", "Unknown"),
        }
        for item in data.get("value", [])
    ]


def merge_news_results(data: dict) -> list:
    """Extract and merge news search results."""
    return [
        {
            "title": item.get("name", "No Title"),
            "url": item.get("url", "#"),
            "snippet": item.get("description", ""),
            "source": (item.get("provider") or [{}])[0].get("name", "Unknown"),
            "date": item.get("datePublished"),
        }
        for item in data.get("value", [])
    ]


def merge_video_results(data: dict) -> list:
    """Extract and merge video search results."""
    return [
        {
            "title": item.get("name", "No Title"),
            "url": item.get("contentUrl", "#"),
            "thumbnail": item.get("thumbnailUrl", ""),
            "source": (item.get("publisher") or [{}])[0].get("name", "Unknown"),
        }
        for item in data.get("value", [])
    ]


# --- Main Coordinator ---
async def perform_search(query: str, count: int) -> dict:
    """
    Call multiple Bing search APIs concurrently and merge their responses.

    The APIs called include:
      - Web search
      - Image search
      - News search
      - Video search

    Returns:
        A dictionary containing merged results from each API.
    """
    # Ensure the query does not exceed the max length.
    if len(query) > MAX_QUERY_LENGTH:
        query = query[:MAX_QUERY_LENGTH]

    # Set up concurrent API calls.
    tasks = [
        fetch_endpoint(WEB_SEARCH_URL, query, count),
        fetch_endpoint(IMAGE_SEARCH_URL, query, count),
        fetch_endpoint(NEWS_SEARCH_URL, query, count),
        fetch_endpoint(VIDEO_SEARCH_URL, query, count),
    ]
    web_data, image_data, news_data, video_data = await asyncio.gather(*tasks)

    # Merge the results from each endpoint.
    return {
        "web": merge_web_results(web_data),
        "images": merge_image_results(image_data),
        "news": merge_news_results(news_data),
        "videos": merge_video_results(video_data),
    }


def format_results_for_llm(results, result_type="Search Results"):
    """
    Formats a list of result dictionaries into a clean, structured format for an LLM.

    Args:
        results (list): List of result dictionaries containing 'title', 'url', 'snippet', 'source', and 'date'.
        result_type (str): Label for the results (e.g., "Web Results", "News Results").

    Returns:
        str: Formatted string suitable for an LLM response.
    """
    if not results:
        return "No relevant results found."

    formatted_output = f"{result_type}:\n\n"

    for index, result in enumerate(results, start=1):
        formatted_output += (
            f"{index}. **{result.get('title', 'No Title')}**\n"
            f"   - Source: {result.get('source', 'Unknown')}\n"
            f"   - Date: {result.get('date', 'N/A')}\n"
            f"   - Snippet: {result.get('snippet', 'No snippet available')}\n"
            f"   - [URL]({result.get('url', '#')})\n\n"
        )

    return formatted_output


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

        return preprocessed_text

    except httpx.HTTPStatusError as http_err:
        error = f"HTTP error occurred: {http_err}"
        return error
    except httpx.RequestError as req_err:
        error = f"HTTP Request error occurred: {req_err}"
        return error
    except Exception as e:
        error = f"An unexpected error occurred: {e}"
        return error


async def fetch_and_convert_to_markdown(url: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()

        # Convert cleaned HTML to Markdown
        markdown_text = html2text.html2text(str(soup))

        return markdown_text

    except httpx.HTTPStatusError as http_err:
        return f"HTTP error occurred: {http_err}"
    except httpx.RequestError as req_err:
        return f"HTTP Request error occurred: {req_err}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"


if __name__ == "__main__":

    async def main():
        url = input("Enter the URL to fetch: ")

        print("Fetching and converting to Markdown...")
        markdown_result = await fetch_and_convert_to_markdown(url)
        print("\nMarkdown Result:\n")
        print(markdown_result)

        print("\nFetching and preprocessing text...")
        preprocessed_text = await perform_fetch(url)
        print("\nPreprocessed Text:\n")
        print(preprocessed_text)

    asyncio.run(main())
