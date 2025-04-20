import asyncio
from typing import List, Annotated
from langchain_core.tools import tool
import re

from langgraph.config import get_stream_writer

from app.langchain.templates.fetch_template import FETCH_TEMPLATE
from app.utils.search_utils import perform_fetch


@tool
async def fetch_webpages(
    urls: Annotated[List[str], "List of URLs to fetch content from"],
) -> dict:
    """
    Fetch the content from a list of URLs and return a formatted summary.
    Automatically adds 'https://' prefix to URLs that don't have a scheme.

    Args:
        urls (List[str]): URLs to fetch content from. URLs without 'http://' or 'https://' will
                         automatically have 'https://' prepended.

    Returns:
        dict: A dictionary containing the combined and formatted content of all fetched pages
              with key "webpage_content", or an error message string in case of failure.
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

        return {"webpage_content": combined_content}

    except Exception as e:
        return {"error": f"An error occurred while fetching webpages: {str(e)}"}
