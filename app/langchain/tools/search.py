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
    """
    Perform a quick, high-level web search to gather brief and relevant information from multiple sources.

    This tool is designed for fast, general-purpose lookups — returning summarized snippets and titles
    from various web and news sources. It prioritizes speed and topical variety over detail.

    ✅ USE THIS TOOL WHEN:
    - The user asks a general question requiring current or public knowledge.
    - You need a quick overview, definition, or summary from external sources.
    - The topic is trending, news-based, or time-sensitive.
    - You need to cite multiple perspectives quickly.

    ❌ DO NOT USE FOR:
    - Detailed, in-depth research or full content analysis → Use `deep_search` instead.
    - Visuals or screenshots of websites.
    - Internal knowledge that the assistant should already know.
    - Personal or conversational responses unrelated to external facts.

    Examples:
    ✅ "What's the latest news on the Ethereum ETF?"
    ✅ "Summarize key facts about the Mars 2025 mission."
    ✅ "What do experts say about intermittent fasting?"
    ❌ "Summarize this PDF." (Not a web search)
    ❌ "Who am I?" (Relies on memory, not web)
    ❌ "Give me the full content of this article." (Use deep search)

    Args:
        query_text: A clear and concise search query for finding high-level web results.

    Returns:
        A JSON string with summarized search data, formatted text, and raw result structure.
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
    """
    Conduct an in-depth search by retrieving and analyzing the full content of web pages.

    This tool should only be used when a user specifically requests:
    - A deep dive into a topic
    - Thorough research or full article content
    - Technical documentation or context-rich explanations
    - Screenshots or visual representations of websites

    Do NOT use this tool for:
    - Simple questions or fact lookups
    - Quick overviews or general summaries
    - Casual or exploratory queries
    - Speed-sensitive responses

    It consumes more time and resources than a standard web search, so use it only when depth and detail
    are explicitly needed.

    Examples:
    ✅ "Can you analyze the full content of this article?"
    ✅ "I need detailed technical documentation about Kubernetes networking."
    ✅ "Give me the complete breakdown from credible sources on how the 2024 AI Act works."
    ❌ "What’s the capital of Sweden?"
    ❌ "Tell me a bit about quantum computing."

    Args:
        query_text: The search query intended for comprehensive exploration.

    Returns:
        A JSON string with full content, summaries, screenshots, and structured data for deep understanding.
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
                print(f"{screenshot_url=}")
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

        # print(f"{deep_search_results=}")
        # Create a response with both formatted text for the LLM and structured data for the frontend
        response = {
            "formatted_text": DEEP_SEARCH_CONTEXT_TEMPLATE.format(
                formatted_content=formatted_content
            ),
            "raw_deep_search_data": {
                # "enhanced_results": enhanced_results,
                # "query": query_text,
                # "elapsed_time": elapsed_time,
                # "result_count": len(enhanced_results),
                **deep_search_results,
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
