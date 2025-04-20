import asyncio
from typing import List, Annotated, Dict, Union
from langchain_core.tools import tool
import re

from langgraph.config import get_stream_writer

from app.langchain.templates.fetch_template import FETCH_TEMPLATE
from app.utils.search_utils import perform_fetch


@tool
async def fetch_webpages(
    urls: Annotated[List[str], "List of URLs to fetch content from"],
) -> Dict[str, Union[str, List[str]]]:
    """Fetch content from provided URLs and return a formatted summary.

    This tool retrieves web content from multiple URLs concurrently.
    It automatically adds 'https://' to URLs missing a protocol prefix.

    Args:
        urls: A list of website URLs to fetch content from

    Returns:
        A dictionary with either successful webpage data or an error message
    """
    if not urls:
        return {"error": "No URLs were provided."}

    processed_urls = []
    combined_content = ""
    writer = get_stream_writer()

    for url in urls:
        writer({"progress": f"Processing URL: '{url:20}'..."})

        if not re.match(r"^https?://", url):
            processed_urls.append(f"https://{url}")
        else:
            processed_urls.append(url)

    try:
        fetch_tasks = [perform_fetch(url) for url in processed_urls]
        fetched_pages = await asyncio.gather(*fetch_tasks, return_exceptions=True)

        for i, page_content in enumerate(fetched_pages):
            if isinstance(page_content, Exception):
                continue

            combined_content += FETCH_TEMPLATE.format(
                page_content=page_content,
                urls=[processed_urls[i]],
            )

            writer({"progress": f"Processing Page {i + 1}/{len(fetched_pages)}..."})

        writer({"progress": "Fetching Complete!"})

        return {"webpage_data": combined_content}

    except Exception as e:
        return {"error": f"An error occurred while fetching webpages: {str(e)}"}
