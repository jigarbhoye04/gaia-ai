import os
import httpx
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Get the Bing API subscription key from the environment variable
subscription_key = os.getenv("BING_API_KEY_1")
if not subscription_key:
    raise EnvironmentError("Missing BING_SUBSCRIPTION_KEY environment variable.")

# Bing Search API endpoint
search_url = "https://api.bing.microsoft.com/v7.0/search"


async def perform_search(query: str):
    """
    Perform a search request using Bing Search API and extract useful information.

    Args:
        query (str): The search query.

    Returns:
        list: Extracted useful information from the search results.
    """
    headers = {"Ocp-Apim-Subscription-Key": subscription_key}
    params = {"q": query, "count": 10}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(search_url, headers=headers, params=params)
            response.raise_for_status()  # Raise an exception for HTTP errors
            data = response.json()  # Parse the JSON response

            # Extract useful information
            results = []
            for item in data.get("webPages", {}).get("value", []):
                results.append(
                    {
                        "title": item.get("name"),
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


if __name__ == "__main__":
    import asyncio

    async def main():
        query = "mostRecent: true who is aryan randeriya?"
        result = await perform_search(query)
        for entry in result:
            print(entry)

    asyncio.run(main())
