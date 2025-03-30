import asyncio
import time
from typing import Any, Dict, List

from app.config.loggers import chat_logger as logger
from app.prompts.user.chat_prompts import (
    DEEP_SEARCH_CONTEXT_TEMPLATE,
    PAGE_CONTENT_TEMPLATE,
    SEARCH_CONTEXT_TEMPLATE,
)
from app.utils.internet_utils import perform_deep_search
from app.utils.search_utils import (
    extract_urls_from_text,
    format_results_for_llm,
    perform_fetch,
    perform_search,
)


async def do_deep_search(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform a deep internet search by fetching and processing web content from search results.

    This pipeline step:
    1. Searches the web for relevant content based on the user's query
    2. Fetches the full content of the top search results concurrently
    3. Converts the content to markdown format for better LLM processing
    4. Optionally takes screenshots of the web pages if enabled
    5. Adds the enhanced content to the message context with appropriate formatting

    Args:
        context (Dict[str, Any]): The pipeline context containing user query and message data

    Returns:
        Dict[str, Any]: The updated context with deep search results added
    """
    start_time = time.time()

    if context["deep_search"] and context["last_message"]:
        query_text = context["query_text"]

        logger.info(f"Starting deep search pipeline step for query: {query_text}")

        try:
            deep_search_results = await perform_deep_search(
                query=query_text, max_results=3, take_screenshots=True
            )

            enhanced_results = deep_search_results.get("enhanced_results", [])

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

                context["last_message"]["content"] += (
                    DEEP_SEARCH_CONTEXT_TEMPLATE.format(
                        formatted_content=formatted_content
                    )
                )

                context["deep_search_results"] = deep_search_results

                elapsed_time = time.time() - start_time
                logger.info(
                    f"Deep search pipeline step completed in {elapsed_time:.2} seconds"
                )
            else:
                logger.info("No enhanced results from deep search")
                context["last_message"]["content"] += (
                    "\n\nNo detailed information found from deep search."
                )
        except (asyncio.TimeoutError, ConnectionError) as e:
            logger.error(f"Network error in deep search: {e}", exc_info=True)
            context["deep_search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nConnection timed out during deep search, falling back to standard results."
            )
        except ValueError as e:
            logger.error(f"Value error in deep search: {e}", exc_info=True)
            context["deep_search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nInvalid search parameters, falling back to standard results."
            )
        except Exception as e:
            logger.error(f"Unexpected error in deep search: {e}", exc_info=True)
            context["deep_search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nError performing deep search, falling back to standard results."
            )

    return context


async def do_search(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform a web search and append relevant context to the last message.

    This pipeline step:
    1. Validates if search is enabled and a query is available
    2. Executes a web search with the query
    3. Formats the results in a structured way for the LLM
    4. Adds the search results to the message context

    Args:
        context (Dict[str, Any]): The pipeline context containing user query and message data

    Returns:
        Dict[str, Any]: The updated context with search results added
    """
    start_time = time.time()

    if context["search_web"] and context["last_message"] and not context["deep_search"]:
        query_text = context["query_text"]
        logger.info(f"Starting web search for query: {query_text}")

        try:
            result_count = 5
            if len(query_text) > 100:
                result_count = 3

            search_results = await perform_search(query=query_text, count=result_count)

            web_results = search_results.get("web", [])
            news_results = search_results.get("news", [])

            formatted_results = ""

            if web_results:
                formatted_results += (
                    format_results_for_llm(web_results, result_type="Web Results")
                    + "\n\n"
                )

            if news_results:
                formatted_results += format_results_for_llm(
                    news_results, result_type="News Results"
                )

            if not formatted_results.strip():
                formatted_results = "No relevant search results found for your query."

            context["last_message"]["content"] += SEARCH_CONTEXT_TEMPLATE.format(
                formatted_results=formatted_results
            )

            context["search_results"] = search_results

            elapsed_time = time.time() - start_time
            logger.info(
                f"Web search completed in {elapsed_time:.2} seconds. Found {len(web_results)} web results and {len(news_results)} news results."
            )

        except (asyncio.TimeoutError, ConnectionError) as e:
            logger.error(f"Network error in web search: {e}", exc_info=True)
            context["search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nConnection timed out during web search. Please try again later."
            )
        except ValueError as e:
            logger.error(f"Value error in web search: {e}", exc_info=True)
            context["search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nInvalid search parameters. Please try a different query."
            )
        except Exception as e:
            logger.error(f"Unexpected error in web search: {e}", exc_info=True)
            context["search_error"] = str(e)
            context["last_message"]["content"] += (
                "\n\nError performing web search. Please try again later."
            )

    return context


async def fetch_webpages(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch multiple webpages and append their content to the last message.
    """

    urls: List[str] = context.get("pageFetchURLs", [])

    if "query_text" in context:
        try:
            extracted_urls = extract_urls_from_text(context["query_text"])
            if extracted_urls:
                for url in extracted_urls:
                    if url not in urls:
                        urls.append(url)

                context["pageFetchURLs"] = urls
        except Exception as e:
            logger.error(f"Error extracting URLs from text: {e}", exc_info=True)
    print(f"{urls=}")
    if urls and context.get("last_message"):
        try:
            fetch_tasks = []
            for url in urls:
                try:
                    fetch_tasks.append(perform_fetch(url))
                except Exception as url_error:
                    logger.error(
                        f"Error creating fetch task for URL {url}: {url_error}"
                    )

            if fetch_tasks:
                fetched_pages = await asyncio.gather(
                    *fetch_tasks, return_exceptions=True
                )
                for i, page_content in enumerate(fetched_pages):
                    if i >= len(urls):
                        continue

                    # if isinstance(page_content, Exception):
                    #     logger.error(f"Error fetching URL {urls[i]}: {page_content}")
                    #     continue

                    print(f"{page_content=}")

                    context["last_message"]["content"] += PAGE_CONTENT_TEMPLATE.format(
                        page_content=page_content, urls=[urls[i]]
                    )
        except Exception as e:
            logger.error(f"Error in fetch_webpages: {e}", exc_info=True)

    return context
