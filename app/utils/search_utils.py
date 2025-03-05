import httpx
from bs4 import BeautifulSoup
from config.settings import settings
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

subscription_key = settings.BING_API_KEY_1
search_url = settings.BING_SEARCH_URL

if not subscription_key:
    raise EnvironmentError("Missing BING_SUBSCRIPTION_KEY environment variable.")


http_async_client = httpx.AsyncClient()


async def perform_search(query: str, count=7):
    headers = {"Ocp-Apim-Subscription-Key": subscription_key}
    params = {
        "q": query,
        "count": count,
        # "responseFilter": "webPages,images",
    }

    try:
        response = await http_async_client.get(
            search_url, headers=headers, params=params
        )
        response.raise_for_status()
        data = response.json()

        # Extract useful information
        results = []
        for item in data.get("webPages", {}).get("value", []):
            results.append(
                {
                    "title": item.get("name"),
                    "url": item.get("url"),
                    "snippet": item.get("snippet"),
                    "source": item.get("siteName"),
                    "date": item.get("dateLastCrawled"),
                }
            )

        # Extract images
        images = []
        # for img in data.get("images", {}).get("value", []):
        #     images.append(
        #         {
        #             "image_url": img.get("contentUrl"),
        #             "thumbnail": img.get("thumbnailUrl"),
        #             "title": img.get("name"),
        #             "source": img.get("hostPageUrl"),
        #         }
        #     )

        return {"results": results, "images": images}

    except httpx.HTTPStatusError as http_err:
        return {"error": f"HTTP error occurred: {http_err}"}
    except httpx.RequestError as req_err:
        return {"error": f"Request error occurred: {req_err}"}
    except Exception as e:
        return {"error": f"An unexpected error occurred: {e}"}


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
