from typing import Any, Dict

from browser_use import Agent, Browser, BrowserConfig
from browser_use.browser.context import BrowserContextConfig, BrowserContext
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config.settings import settings

load_dotenv()

router = APIRouter()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY
)

config = BrowserContextConfig(
    # cookies_file="path/to/cookies.json",
    # wait_for_network_idle_page_load_time=3.0,
    # browser_window_size={"width": 1280, "height": 1100},
    # locale="en-US",
    # user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36",
    highlight_elements=False,
    # viewport_expansion=500,
    # allowed_domains=["google.com", "wikipedia.org"],
)

browser = Browser()
context = BrowserContext(browser=browser, config=config)
config = BrowserConfig(headless=True, disable_security=True)


@router.post("/browser", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def execute_browser_task(task: str):
    """
    Execute a browser task using the browser agent.

    Args:
        task: The task to be performed by the browser agent

    Returns:
        The results from the browser agent
    """
    try:
        agent = Agent(
            browser_context=context,
            task=task,
            llm=llm,
        )
        result = await agent.run()
        return {"status": "success", "result": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing browser task: {str(e)}",
        )
