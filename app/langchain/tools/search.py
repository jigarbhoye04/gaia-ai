import asyncio
import json
import time
from typing import Annotated
from langchain_core.tools import tool

from app.prompts.user.chat_prompts import SEARCH_CONTEXT_TEMPLATE
from app.utils.search_utils import format_results_for_llm, perform_search
from app.config.loggers import chat_logger as logger


@tool
async def web_search(
    query_text: Annotated[
        str,
        "The search query to look up on the web. Be specific and concise for better results.",
    ],
) -> str:
    """Searches the web for recent information on a given query and returns formatted results.

    This tool performs a comprehensive web search using Bing Search API and returns both regular web results
    and news results. Use this tool when you need to find up-to-date information about:
    - Current events, news, or recent developments
    - Facts, statistics or information not in your training data
    - Information that changes frequently (weather, prices, schedules)
    - Latest product releases, updates, or technology trends

    Args:
        query_text: The search query to look up on the web.

    Returns:
        A JSON string containing formatted search results for LLM and structured data for the frontend.
    """
    start_time = time.time()

    try:
        # Perform the search with 5 results
        search_results = await perform_search(query=query_text, count=5)

        web_results = search_results.get("web", [])
        news_results = search_results.get("news", [])
        formatted_results = ""

        if web_results:
            formatted_results += (
                format_results_for_llm(web_results, result_type="Web Results") + "\n\n"
            )

        if news_results:
            formatted_results += format_results_for_llm(
                news_results, result_type="News Results"
            )

        if not formatted_results.strip():
            formatted_results = "No relevant search results found for your query."

        elapsed_time = time.time() - start_time
        logger.info(
            f"Web search completed in {elapsed_time:.2f} seconds. Found {len(web_results)} web results and {len(news_results)} news results."
        )

        # Create a response with both formatted text for the LLM and structured data for the frontend
        response = {
            "formatted_text": SEARCH_CONTEXT_TEMPLATE.format(
                formatted_results=formatted_results
            ),
            "raw_search_data": {
                "web_results": web_results,
                "news_results": news_results,
                "query": query_text,
                "elapsed_time": elapsed_time,
                "result_count": {"web": len(web_results), "news": len(news_results)},
            },
        }

        return json.dumps(response)

    except (asyncio.TimeoutError, ConnectionError) as e:
        logger.error(f"Network error in web search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nConnection timed out during web search. Please try again later.",
            "error": str(e),
        }
        return json.dumps(error_response)
    except ValueError as e:
        logger.error(f"Value error in web search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nInvalid search parameters. Please try a different query.",
            "error": str(e),
        }
        return json.dumps(error_response)
    except Exception as e:
        logger.error(f"Unexpected error in web search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nError performing web search. Please try again later.",
            "error": str(e),
        }
        return json.dumps(error_response)
