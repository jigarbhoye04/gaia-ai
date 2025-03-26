import asyncio
import re
import time
from typing import Any, Dict, Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from app.config.loggers import search_logger as logger
from app.db.collections import (
    search_urls_collection,
)
from app.db.db_redis import get_cache, set_cache
from app.models.search_models import URLResponse
from app.services.internet_service import CACHE_EXPIRY, MAX_CONTENT_LENGTH, URL_TIMEOUT
from app.services.search_service import MAX_TOTAL_CONTENT
from app.utils.search_utils import perform_search


def is_valid_url(url: str) -> bool:
    """
    Validate if a URL is well-formed and uses an acceptable protocol.

    Args:
        url (str): The URL to validate

    Returns:
        bool: True if URL is valid, False otherwise
    """
    try:
        parsed = urlparse(url)
        # Check for acceptable protocols
        if parsed.scheme not in ("http", "https"):
            return False
        # Check for presence of netloc (domain)
        if not parsed.netloc:
            return False
        # Reject IP addresses (basic check)
        if re.match(r"^\d+\.\d+\.\d+\.\d+$", parsed.netloc):
            logger.warning(f"IP address URL rejected: {url}")
            return False
        return True
    except Exception:
        return False


async def get_cached_webpage_content(url: str) -> Optional[Dict[str, Any]]:
    """
    Try to get cached webpage content.

    Args:
        url (str): The URL to fetch from cache

    Returns:
        Optional[Dict[str, Any]]: Cached content or None if not in cache
    """
    cache_key = f"webpage_content:{url}"
    try:
        cached_data = await get_cache(cache_key)
        if cached_data:
            logger.info(f"Cache hit for URL: {url}")
            return cached_data
    except Exception as e:
        logger.error(f"Error checking cache for {url}: {e}")
    return None


async def save_webpage_cache(url: str, content: str, markdown_content: str) -> None:
    """
    Save webpage content to cache.

    Args:
        url (str): The URL of the webpage
        content (str): The raw text content
        markdown_content (str): The markdown-formatted content
    """
    cache_key = f"webpage_content:{url}"
    cache_data = {
        "url": url,
        "content": content,
        "markdown_content": markdown_content,
        "timestamp": time.time(),
    }
    try:
        await set_cache(cache_key, cache_data, CACHE_EXPIRY)
        logger.info(f"Cached content for URL: {url}")
    except Exception as e:
        logger.error(f"Error caching content for {url}: {e}")


async def fetch_and_process_url(
    url: str, max_length: int = MAX_CONTENT_LENGTH
) -> Dict[str, Any]:
    """
    Fetch and process a single URL with error handling, validation and caching.

    Args:
        url (str): The URL to fetch
        max_length (int): Maximum content length to return

    Returns:
        Dict[str, Any]: Dictionary with processed content and metadata
    """
    # Check URL validity
    if not is_valid_url(url):
        logger.warning(f"Invalid URL format: {url}")
        return {
            "url": url,
            "error": "Invalid URL format",
            "content": "",
            "markdown_content": "",
        }

    # Try to get cached content
    cached_content = await get_cached_webpage_content(url)
    if cached_content:
        return {
            "url": url,
            "content": cached_content.get("content", ""),
            "markdown_content": cached_content.get("markdown_content", ""),
            "from_cache": True,
        }

    # Fetch new content with proper error handling
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=URL_TIMEOUT,
            headers={"User-Agent": "Mozilla/5.0 GAIA Web Research Bot"},
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

            # Check content type - reject non-text content
            content_type = response.headers.get("content-type", "")
            if not content_type.startswith(
                (
                    "text/",
                    "application/json",
                    "application/xml",
                    "application/xhtml+xml",
                )
            ):
                return {
                    "url": url,
                    "error": f"Unsupported content type: {content_type}",
                    "content": "",
                    "markdown_content": "",
                }

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove script, style, and other non-content elements
            for element in soup(
                ["script", "style", "nav", "footer", "iframe", "noscript"]
            ):
                element.extract()

            # Get text content
            text = soup.get_text(separator="\n", strip=True)

            # Process text
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            content = "\n".join(chunk for chunk in chunks if chunk)

            # Truncate if needed
            if len(content) > max_length:
                content = content[:max_length] + "...[content truncated]"

            # Convert to markdown
            markdown_content = await convert_to_markdown(content)

            # Cache the result
            await save_webpage_cache(url, content, markdown_content)

            return {
                "url": url,
                "content": content,
                "markdown_content": markdown_content,
                "from_cache": False,
            }
    except httpx.TimeoutException:
        logger.error(f"Timeout fetching {url}")
        return {
            "url": url,
            "error": "Request timed out",
            "content": "",
            "markdown_content": "",
        }
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error {e.response.status_code} fetching {url}: {e}")
        return {
            "url": url,
            "error": f"HTTP error: {e.response.status_code}",
            "content": "",
            "markdown_content": "",
        }
    except httpx.RequestError as e:
        logger.error(f"Request error fetching {url}: {e}")
        return {
            "url": url,
            "error": f"Request error: {str(e)}",
            "content": "",
            "markdown_content": "",
        }
    except Exception as e:
        logger.error(f"Unexpected error fetching {url}: {e}")
        return {
            "url": url,
            "error": f"Error: {str(e)}",
            "content": "",
            "markdown_content": "",
        }


async def fetch_url_metadata(url: str) -> URLResponse:
    """Fetch metadata for a URL, with caching and database fallback."""

    cache_key = f"url_metadata:{url}"
    metadata = await get_cache(cache_key) or await search_urls_collection.find_one(
        {"url": url}
    )

    if metadata:
        return URLResponse(**metadata)

    metadata = await scrape_url_metadata(url)

    await search_urls_collection.insert_one(metadata)
    await set_cache(cache_key, metadata, 864000)

    return URLResponse(**metadata)


async def scrape_url_metadata(url: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        def to_absolute(relative_url: str) -> str:
            if not relative_url:
                return None
            parsed = urlparse(relative_url)
            if parsed.scheme in ["http", "https"]:
                return relative_url
            return urljoin(url, relative_url)

        title = soup.title.string.strip() if soup.title else None

        description_tag = soup.find("meta", attrs={"name": "description"}) or soup.find(
            "meta", attrs={"property": "og:description"}
        )
        description = (
            description_tag["content"].strip()
            if description_tag and "content" in description_tag.attrs
            else None
        )

        website_name_tag = soup.find("meta", property="og:site_name") or soup.find(
            "meta", attrs={"name": "application-name"}
        )
        website_name = (
            website_name_tag["content"].strip()
            if website_name_tag and "content" in website_name_tag.attrs
            else None
        )

        favicon_tag = soup.find("link", rel=lambda r: r and "icon" in r.lower())
        favicon = (
            to_absolute(favicon_tag["href"])
            if favicon_tag and "href" in favicon_tag.attrs
            else None
        )

        og_image_tag = soup.find("meta", property="og:image")
        og_image = (
            to_absolute(og_image_tag["content"])
            if og_image_tag and "content" in og_image_tag.attrs
            else None
        )

        logo_tag = soup.find("meta", property="og:logo") or soup.find(
            "link", rel="logo"
        )
        website_image = (
            to_absolute(
                logo_tag["content"]
                if logo_tag and "content" in logo_tag.attrs
                else logo_tag["href"]
            )
            if logo_tag
            else og_image
        )

        return {
            "title": title,
            "description": description,
            "favicon": favicon or og_image,
            "website_name": website_name,
            "website_image": website_image,
            "url": url,
        }

    except (httpx.RequestError, httpx.HTTPStatusError) as exc:
        logger.error(f"Error fetching URL metadata: {exc}")
    except Exception as exc:
        logger.error(f"Unexpected error: {exc}")

    return {
        "title": None,
        "description": None,
        "favicon": None,
        "website_name": None,
        "website_image": None,
        "url": url,
    }


async def convert_to_markdown(text: str) -> str:
    """
    Convert plaintext to markdown format.

    Args:
        text (str): The plaintext to convert

    Returns:
        str: The markdown formatted text
    """
    # Basic markdown transformation
    # This is a simple implementation that could be expanded
    paragraphs = text.split("\n\n")
    markdown_text = ""

    for i, p in enumerate(paragraphs):
        p = p.strip()
        if not p:
            continue

        # Check if paragraph might be a header
        if len(p) < 100 and not p.endswith("."):
            markdown_text += f"## {p}\n\n"
        else:
            markdown_text += f"{p}\n\n"

    return markdown_text


async def perform_deep_search(query: str, max_results: int = 3) -> Dict[str, Any]:
    """
    Perform a deep search by first searching the web, then concurrently fetching
    the content of the top results and converting them to markdown.

    Args:
        query (str): The search query
        max_results (int): Maximum number of results to process in depth

    Returns:
        Dict[str, Any]: A dictionary containing search results with fetched content
    """
    start_time = time.time()
    logger.info(f"Starting deep search for query: {query}")

    # Get basic search results first
    search_results = await perform_search(query=query, count=max_results)
    web_results = search_results.get("web", [])

    if not web_results:
        logger.info("No web results found for deep search")
        return {"original_search": search_results, "enhanced_results": []}

    # Set up concurrent fetching tasks for all URLs
    fetch_tasks = []
    for result in web_results[:max_results]:
        url = result.get("url")
        if url and is_valid_url(url):
            fetch_tasks.append(fetch_and_process_url(url))

    # Execute all fetch tasks concurrently
    if fetch_tasks:
        url_contents = await asyncio.gather(*fetch_tasks)
    else:
        url_contents = []

    # Process results and manage total content size
    enhanced_results = []
    total_content_size = 0

    for i, (result, content_data) in enumerate(
        zip(web_results[:max_results], url_contents)
    ):
        # Skip if no URL or we've reached content limit
        if i >= len(web_results) or total_content_size >= MAX_TOTAL_CONTENT:
            break

        url = result.get("url")
        if not url:
            continue

        # If fetching was successful, add the content
        if not content_data.get("error"):
            markdown_content = content_data.get("markdown_content", "")

            # Check if adding this content would exceed the total limit
            if total_content_size + len(markdown_content) > MAX_TOTAL_CONTENT:
                # Truncate the content to fit within limits
                available_space = MAX_TOTAL_CONTENT - total_content_size
                if available_space > 0:
                    markdown_content = (
                        markdown_content[:available_space]
                        + "...[content truncated for size limits]"
                    )

            # Update running total of content size
            total_content_size += len(markdown_content)

            # Create the enhanced result with the processed content
            enhanced_result = {
                **result,
                "full_content": markdown_content,
                "from_cache": content_data.get("from_cache", False),
            }
        else:
            # Still include results where fetching failed, but note the error
            enhanced_result = {
                **result,
                "full_content": f"Error fetching content: {content_data.get('error')}",
                "fetch_error": content_data.get("error"),
            }

        enhanced_results.append(enhanced_result)

    elapsed_time = time.time() - start_time
    logger.info(
        f"Deep search completed in {elapsed_time:.2f} seconds. Processed {len(enhanced_results)} results."
    )

    return {
        "original_search": search_results,
        "enhanced_results": enhanced_results,
        "metadata": {
            "total_content_size": total_content_size,
            "elapsed_time": elapsed_time,
            "query": query,
        },
    }
