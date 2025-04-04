import asyncio
import re

import html2text
import httpx
import tldextract
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright

from app.config.loggers import search_logger as logger
from app.config.settings import settings
from urlextract import URLExtract

subscription_key = settings.BING_API_KEY_1

if not subscription_key:
    raise EnvironmentError("Missing BING_SUBSCRIPTION_KEY environment variable.")


http_async_client = httpx.AsyncClient()
extractor = URLExtract()
extractor.update()

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
async def perform_search(
    query: str,
    count: int,
    web: bool = True,
    images: bool = True,
    news: bool = True,
    videos: bool = True,
) -> dict:
    """Perform selected Bing searches concurrently and return merged results."""

    if len(query) > MAX_QUERY_LENGTH:
        query = query[:MAX_QUERY_LENGTH]

    search_options = {
        "web": (web, WEB_SEARCH_URL, merge_web_results),
        "images": (images, IMAGE_SEARCH_URL, merge_image_results),
        "news": (news, NEWS_SEARCH_URL, merge_news_results),
        "videos": (videos, VIDEO_SEARCH_URL, merge_video_results),
    }

    # Prepare tasks for enabled searches
    tasks, keys, merge_funcs = [], [], []
    for key, (enabled, url, merge_func) in search_options.items():
        if enabled:
            tasks.append(fetch_endpoint(url, query, count))
            keys.append(key)
            merge_funcs.append(merge_func)

    # Execute API calls concurrently
    results = await asyncio.gather(*tasks)

    # Merge and return results
    return {keys[i]: merge_funcs[i](results[i]) for i in range(len(results))}


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


def extract_urls_from_text(text: str) -> list[str]:
    """
    Extracts valid URLs from text, with robust handling of various URL formats.

    This function handles:
    - URLs with or without protocol (http://, https://)
    - URLs with query parameters and fragments
    - International domain names
    - URLs containing special characters
    - URLs with paths, including those with special characters

    Args:
        text: Text containing potential URLs

    Returns:
        List of normalized valid URLs with proper protocols
    """
    if not text:
        return []

    urls = extractor.find_urls(text=text)
    return urls

    # More comprehensive URL pattern that handles more edge cases
    url_pattern = r"""
        (?:https?://)?                                # Optional protocol (http:// or https://)
        (?:www\.)?                                    # Optional www subdomain
        (?:                                          
            [a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]\.     # Domain name
            |                                         
            [a-zA-Z0-9]\.                             # Single-letter domain
        )
        [a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}        # TLD
        (?::[0-9]+)?                                  # Optional port
        (?:                                          
            /(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]|          # Path with allowed chars
            \([-a-zA-Z0-9()@:%_\+.~#?&/=]*\)|         # Balanced parentheses
            \[[-a-zA-Z0-9()@:%_\+.~#?&/=]*\])*        # Balanced brackets
        )?
    """

    # Use verbose mode for the regex to allow comments and spacing
    possible_urls = re.findall(url_pattern, text, re.VERBOSE)

    valid_urls = []
    seen_urls = set()  # To avoid duplicates

    for url in possible_urls:
        try:
            # Clean up the URL
            url = url.strip()

            # Skip empty URLs
            if not url:
                continue

            # Extract domain parts to validate
            extracted = tldextract.extract(url)

            # Validate that we have both a domain and suffix
            if not (extracted.domain and extracted.suffix):
                continue

            # Normalize the URL by ensuring it has a protocol
            normalized_url = (
                url if url.startswith(("http://", "https://")) else f"https://{url}"
            )

            # Avoid duplicates
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                valid_urls.append(normalized_url)

        except Exception as e:
            # Log the error without breaking the function
            logger.error(f"Error processing URL candidate '{url}': {e}")
            continue

    return valid_urls


class FetchError(Exception):
    """Custom exception for fetch-related errors."""

    pass


async def fetch_with_httpx(url: str) -> str:
    """Fetches webpage content using httpx (fast for static pages)."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10)
            response.raise_for_status()
            return response.text
    except httpx.HTTPStatusError as http_err:
        raise FetchError(f"HTTP error: {http_err}") from http_err
    except httpx.RequestError as req_err:
        raise FetchError(f"Request error: {req_err}") from req_err
    except Exception as e:
        raise FetchError(f"Unexpected error: {type(e).__name__}: {e}") from e


async def fetch_with_playwright(
    url: str,
    wait_time: int = 3,
    wait_for_element: str = "body",
    take_screenshot: bool = False,
) -> dict:
    """Fetches webpage content using Playwright with optimizations.

    Args:
        url: URL to fetch
        wait_time: Time to wait after page load
        wait_for_element: Selector to wait for
        take_screenshot: Whether to take a screenshot of the page

    Returns:
        Dictionary containing HTML content and optionally screenshot data
    """
    browser = None
    page = None
    context = None

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)

            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            )
            page = await context.new_page()

            async def intercept_requests(route):
                if route.request.resource_type in [
                    "image",
                    "stylesheet",
                    "font",
                    "media",
                    "xhr",
                ]:
                    await route.abort()
                else:
                    await route.continue_()

            # Only intercept requests if not taking screenshot to ensure visuals load properly
            if not take_screenshot:
                await page.route("**/*", intercept_requests)

            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_selector(wait_for_element, timeout=15000)
            await page.wait_for_timeout(wait_time * 1000)
            content = await page.content()

            result = {"content": content}

            # Take screenshot if requested
            if take_screenshot:
                # Set viewport to a reasonable size
                await page.set_viewport_size({"width": 1280, "height": 1024})
                # Wait extra time for visuals to load when taking screenshots
                await page.wait_for_timeout(2000)
                screenshot_bytes = await page.screenshot(
                    type="jpeg", quality=80, full_page=True
                )
                result["screenshot"] = screenshot_bytes

            await page.close()
            await context.close()
            await browser.close()
            return result

    except Exception as e:
        logger.error(f"Unexpected error: {type(e).__name__}: {e}")
        if page and not page.is_closed():
            await page.close()
        if context:
            await context.close()
        if browser and not browser.is_closed():
            await browser.close()
        raise FetchError(f"Unexpected error: {type(e).__name__}") from e


async def upload_screenshot_to_cloudinary(screenshot_bytes: bytes, url: str) -> str:
    """
    Upload a screenshot to Cloudinary and return the secure URL.

    Args:
        screenshot_bytes: The raw bytes of the screenshot
        url: The URL that was screenshotted (for naming purposes)

    Returns:
        str: The secure URL of the uploaded image
    """
    import io
    import time
    import uuid
    import cloudinary
    import cloudinary.uploader
    from urllib.parse import urlparse

    try:
        # Ensure Cloudinary is initialized

        # Create a unique ID for the screenshot
        screenshot_id = str(uuid.uuid4())

        # Get the hostname for the public_id
        parsed_url = urlparse(url)
        hostname = parsed_url.netloc

        # Create public_id with timestamp, hostname, and UUID to ensure uniqueness
        timestamp = int(time.time())
        public_id = (
            f"screenshots/{hostname.replace('.', '_')}/{timestamp}_{screenshot_id}"
        )

        # Upload the screenshot to Cloudinary
        upload_result = cloudinary.uploader.upload(
            io.BytesIO(screenshot_bytes),
            resource_type="image",
            public_id=public_id,
            overwrite=True,
        )

        image_url = upload_result.get("secure_url")
        if not image_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None

        logger.info(f"Screenshot uploaded successfully. URL: {image_url}")
        return image_url

    except Exception as e:
        logger.error(
            f"Failed to upload screenshot to Cloudinary: {str(e)}", exc_info=True
        )
        return None


async def extract_text(html: str) -> str:
    """Extracts and cleans text from HTML content."""
    print("extracting text")
    soup = BeautifulSoup(html, "html.parser")
    print("extracting text 1")
    for tag in ["script", "style", "nav", "footer", "iframe", "noscript"]:
        print("extracting text tag", tag)
        for element in soup.find_all(tag):
            element.extract()

    print("extracting text 2")
    text = soup.get_text(separator="\n", strip=True)
    print("extracting text 3")
    lines = (line.strip() for line in text.splitlines())
    print("extracting text 4")
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    print("extracting text 5")
    content = "\n".join(chunk for chunk in chunks if chunk)
    print(f"this is the extracted text: {content=}")
    return content


async def perform_fetch(url: str, use_playwright: bool = True) -> str:
    """Fetches webpage content using either httpx or Playwright based on `use_playwright`."""
    try:
        html = await (
            fetch_with_playwright(url) if use_playwright else fetch_with_httpx(url)
        )
        return await extract_text(
            html.get("content", "Error: Could not fetch content.")
        )
    except FetchError as e:
        return f"[ERROR] {e}"


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
