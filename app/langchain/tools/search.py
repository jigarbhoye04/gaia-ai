import asyncio
import json
import time
from typing import Annotated
from langchain_core.tools import tool

from app.langchain.templates.search_templates import SEARCH_TEMPLATE
from app.utils.search_utils import format_results_for_llm, perform_search
from app.config.loggers import chat_logger as logger

from app.prompts.user.chat_prompts import DEEP_SEARCH_CONTEXT_TEMPLATE
from app.utils.internet_utils import perform_deep_search


@tool
async def web_search(
    query_text: Annotated[
        str,
        "The search query to look up on the web. Be specific and concise for better results.",
    ],
) -> str:
    """Performs a QUICK search for information with summarized results from multiple sources.

    This tool conducts a standard web search that returns brief snippets and summaries from
    multiple web sources. It's optimized for SPEED and BREADTH of information.

    BEST FOR:
    - Getting a quick overview of a topic from multiple sources
    - Finding basic facts, definitions, or general information
    - Discovering different perspectives on a topic
    - Identifying top sources without reading their full content
    - Quick answers to straightforward questions

    DO NOT USE FOR:
    - Detailed analysis of specific web pages
    - Complete article content or in-depth information
    - When you need extensive context from a single source
    - Visual content like screenshots of websites

    Args:
        query_text: The search query to find quick information about.

    Returns:
        A JSON string containing formatted search results (titles, URLs, snippets) and structured data.
    """
    start_time = time.time()

    try:
        # Perform the search with 5 results
        search_results = await perform_search(query=query_text, count=5)
        print(f"{search_results=}")

        web_results = search_results.get("web", [])
        news_results = search_results.get("news", [])
        image_results = search_results.get("images", [])
        video_results = search_results.get("videos", [])
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

        response = {
            "formatted_text": SEARCH_TEMPLATE.format(
                formatted_results=formatted_results
            ),
            "raw_search_data": {
                "web": web_results,
                "news": news_results,
                "images": image_results,
                "videos": video_results,
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


@tool
async def deep_search(
    query_text: Annotated[
        str,
        "The search query for in-depth research. Be specific to get thorough and comprehensive results.",
    ],
) -> str:
    """Performs an IN-DEPTH analysis by retrieving and processing FULL CONTENT from web pages.

    This tool conducts comprehensive research by not only finding relevant pages but also
    retrieving their complete content, analyzing it, and even capturing visual representations.
    It's optimized for DEPTH and THOROUGHNESS at the cost of additional processing time.

    BEST FOR:
    - Detailed research requiring full page content analysis
    - When you need to understand complex topics with extensive context
    - Extracting specific information buried deep in web pages
    - When visual context from screenshots would be helpful
    - Technical topics where complete documentation is needed

    DO NOT USE FOR:
    - Simple factual questions that need quick answers
    - When breadth of information is more important than depth
    - Topics where a brief overview would suffice
    - When speed is more important than comprehensiveness

    Args:
        query_text: The search query to research in depth.

    Returns:
        A JSON string containing complete page content, screenshots, and comprehensive analysis.
    """
    start_time = time.time()

    try:
        deep_search_results = await perform_deep_search(
            query=query_text, max_results=3, take_screenshots=True
        )

        enhanced_results = deep_search_results.get("enhanced_results", [])
        formatted_content = ""

        if enhanced_results:
            formatted_content = "## Deep Search Results\n\n"

            for i, result in enumerate(enhanced_results, 1):
                title = result.get("title", "No Title")
                url = result.get("url", "#")
                snippet = result.get("snippet", "No snippet available")
                full_content = result.get("full_content", "")
                fetch_error = result.get("fetch_error", None)
                screenshot_url = result.get("screenshot_url", None)

                formatted_content += f"### {i}. {title}\n"
                formatted_content += f"**URL**: {url}\n\n"

                if screenshot_url:
                    formatted_content += f"**Screenshot**: ![Screenshot of {title}]({screenshot_url})\n\n"

                if fetch_error:
                    formatted_content += (
                        f"**Note**: Could not fetch full content: {fetch_error}\n\n"
                    )
                    formatted_content += f"**Summary**: {snippet}\n\n"
                else:
                    formatted_content += f"**Summary**: {snippet}\n\n"
                    formatted_content += "**Content**:\n"
                    formatted_content += full_content + "\n\n"

                formatted_content += "---\n\n"
        else:
            formatted_content = "No detailed information found from deep search."

        elapsed_time = time.time() - start_time
        logger.info(f"Deep search completed in {elapsed_time:.2f} seconds")

        # Create a response with both formatted text for the LLM and structured data for the frontend
        response = {
            "formatted_text": DEEP_SEARCH_CONTEXT_TEMPLATE.format(
                formatted_content=formatted_content
            ),
            "raw_deep_search_data": {
                "enhanced_results": enhanced_results,
                "query": query_text,
                "elapsed_time": elapsed_time,
                "result_count": len(enhanced_results),
            },
        }

        return json.dumps(response)

    except (asyncio.TimeoutError, ConnectionError) as e:
        logger.error(f"Network error in deep search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nConnection timed out during deep search, falling back to standard results.",
            "error": str(e),
        }
        return json.dumps(error_response)
    except ValueError as e:
        logger.error(f"Value error in deep search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nInvalid search parameters, falling back to standard results.",
            "error": str(e),
        }
        return json.dumps(error_response)
    except Exception as e:
        logger.error(f"Unexpected error in deep search: {e}", exc_info=True)
        error_response = {
            "formatted_text": "\n\nError performing deep search, falling back to standard results.",
            "error": str(e),
        }
        return json.dumps(error_response)
