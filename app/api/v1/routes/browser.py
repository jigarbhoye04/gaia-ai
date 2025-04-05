import asyncio
import time
from typing import Dict, Optional
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from browser_use import Agent, Browser
from browser_use import BrowserConfig as BrowserUseConfig
from browser_use.agent.views import AgentOutput
from browser_use.browser.context import BrowserContext, BrowserContextConfig
from browser_use.browser.views import BrowserState
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel

from app.config.loggers import app_logger as logger
from app.config.settings import settings

load_dotenv()


router = APIRouter()


llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY
)


active_browser_sessions = {}


class BrowserConfigModel(BaseModel):
    headless: bool = False
    disable_security: bool = True


class EventAgent(Agent):
    def __init__(
        self,
        browser_context,
        task,
        llm,
        session_id=None,
        websocket=None,
    ):
        self.session_id = session_id
        self.websocket = websocket
        self.loop = asyncio.get_event_loop()
        self.screenshots = []
        self.current_step = 0
        self.step_history = []  # Store history of steps for final message

        async def new_step_callback(
            state: BrowserState,
            model_output: AgentOutput,
            steps: int,
        ):
            logger.info("THIS IS A TEST 1")
            # path = f"./screenshots/{steps}.png"
            # last_screenshot = state.screenshot
            # img_path = utils.base64_to_image(
            #     base64_string=str(last_screenshot), output_filename=path
            # )

            thoughts = {
                # "page_summary": model_output.current_state.page_summary,
                "evaluation": model_output.current_state.evaluation_previous_goal,
                "memory": model_output.current_state.memory,
                "next_goal": model_output.current_state.next_goal,
            }
            actions = [
                action.model_dump(exclude_unset=True) for action in model_output.action
            ]

            step_data = {
                "step": steps,
                "thoughts": thoughts,
                "actions": actions,
                "url": state.url,
                "title": state.title,
            }

            # Update current step
            self.current_step = steps

            # Save screenshot if available
            if state.screenshot:
                self.screenshots.append(str(state.screenshot))

                # Upload screenshot to Cloudinary
                try:
                    screenshot_result = await upload_base64_screenshot_to_cloudinary(
                        str(state.screenshot), self.session_id, steps
                    )

                    if screenshot_result and screenshot_result.get("url"):
                        # Add screenshot URL to step data
                        step_data["screenshot_url"] = screenshot_result["url"]
                except Exception as e:
                    logger.error(f"Error uploading step screenshot: {str(e)}")

            # Send step data to websocket
            await self.websocket.send_json(
                {
                    "type": "step_update",
                    "data": step_data,
                    "session_id": self.session_id,
                },
            )
            
            # Store the step data for final message
            self.step_history.append(step_data)

            logger.info(
                "THIS IS A TEST 2",
                {
                    "type": "step_update",
                    "data": step_data,
                    "session_id": self.session_id,
                },
            )

        # async def _upload_and_send_screenshot(self, screenshot_base64: str, step: int):
        #     """Upload screenshot to Cloudinary and send URL to client"""
        #     try:
        #         result = await upload_base64_screenshot_to_cloudinary(
        #             screenshot_base64, self.session_id, step
        #         )
        #         if result:
        #             await self.safe_send_websocket_json(
        #                 {
        #                     "type": "screenshot",
        #                     "data": {
        #                         "step": step,
        #                         "image_url": result["url"],
        #                         "timestamp": time.time(),
        #                     },
        #                     "session_id": self.session_id,
        #                 }
        #             )
        #     except Exception as e:
        #         logger.error(f"Error uploading screenshot: {str(e)}")

        super().__init__(
            browser_context=browser_context,
            task=task,
            llm=llm,
            register_new_step_callback=new_step_callback,
        )

    async def run(self):
        """Override the run method to include step history in final processing."""
        # Call the original run method from the parent class
        result = await super().run()
        
        # If we have step history, add a summary using the step history
        if self.step_history:
            try:
                # Create a summary based on the step history
                summary = await self._generate_history_summary()
                
                # Add the summary to the result if possible
                if hasattr(result, "add_summary"):
                    result.add_summary(summary)
                elif hasattr(result, "history") and result.history:
                    # Try to add to the last history item
                    last_item = result.history[-1]
                    if hasattr(last_item, "model_output") and hasattr(last_item.model_output, "current_state"):
                        last_item.model_output.current_state.memory += f"\n\nHistory Summary: {summary}"
            except Exception as e:
                logger.error(f"Error adding step history summary: {str(e)}", exc_info=True)
        
        return result
    
    async def _generate_history_summary(self):
        """Generate a summary of the step history for the agent to use."""
        try:
            if not self.step_history:
                return ""
            
            # Create a prompt for the LLM to summarize the history
            history_text = "\n\n".join([
                f"Step {step.get('step')}: "
                f"URL: {step.get('url')} | "
                f"Title: {step.get('title')} | "
                f"Evaluation: {step.get('thoughts', {}).get('evaluation')} | "
                f"Memory: {step.get('thoughts', {}).get('memory')} | "
                f"Next Goal: {step.get('thoughts', {}).get('next_goal')}"
                for step in self.step_history
            ])
            
            prompt = f"Summarize the following browser navigation history to provide context for final task conclusion:\n\n{history_text}"
            
            # Use the LLM to generate a summary
            response = await self.llm.apredict(prompt)
            return response
        except Exception as e:
            logger.error(f"Error generating history summary: {str(e)}", exc_info=True)
            return "Error generating summary from step history."


async def upload_base64_screenshot_to_cloudinary(
    base64_string: str, session_id: str, step: int
) -> Optional[Dict[str, str]]:
    """Upload base64 encoded screenshot to Cloudinary and return URL."""
    try:
        if not base64_string:
            return None

        screenshot_id = str(uuid4())
        timestamp = int(time.time())
        public_id = f"browser/{session_id}/{timestamp}_{step}_{screenshot_id}"

        if not base64_string.startswith("data:image"):
            upload_data = f"data:image/png;base64,{base64_string}"
        else:
            upload_data = base64_string

        upload_result = cloudinary.uploader.upload(
            upload_data,
            resource_type="auto",
            public_id=public_id,
            overwrite=True,
        )

        image_url = upload_result.get("secure_url")
        if not image_url:
            logger.error("Missing secure_url in Cloudinary upload response")
            return None

        logger.info(f"Screenshot uploaded successfully. URL: {image_url}")
        return {
            "url": image_url,
            "public_id": upload_result.get("public_id"),
            "resource_type": "image",
        }
    except Exception as e:
        logger.error(f"Failed to upload screenshot: {str(e)}", exc_info=True)
        return None


async def close_browser_session(session_id: str) -> bool:
    """Close a browser session and clean up resources."""
    if session_id not in active_browser_sessions:
        return False

    try:
        session = active_browser_sessions[session_id]
        browser = session["browser"]
        await browser.close()
        del active_browser_sessions[session_id]
        logger.info(f"Closed browser session {session_id}")
        return True
    except Exception as e:
        logger.error(f"Error closing browser session {session_id}: {str(e)}")
        return False


async def process_result_screenshots(result, session_id):
    """Process screenshots in result history and replace base64 with Cloudinary URLs."""
    try:
        if not result or "history" not in result:
            return result

        # Create a deep copy to avoid modifying the original
        processed_result = result.copy()

        # Process each history item
        for i, history_item in enumerate(processed_result.get("history", [])):
            if "state" in history_item and "screenshot" in history_item["state"]:
                # Get the step number
                step = history_item.get("metadata", {}).get("step_number", i)

                # Upload screenshot to Cloudinary
                screenshot_data = history_item["state"]["screenshot"]
                if screenshot_data and isinstance(screenshot_data, str):
                    try:
                        cloudinary_result = (
                            await upload_base64_screenshot_to_cloudinary(
                                screenshot_data, session_id, step
                            )
                        )

                        if cloudinary_result and cloudinary_result.get("url"):
                            # Replace base64 with URL
                            history_item["state"]["screenshot"] = cloudinary_result[
                                "url"
                            ]
                        else:
                            # Remove screenshot if upload failed
                            history_item["state"]["screenshot"] = None
                    except Exception as e:
                        logger.error(f"Error processing screenshot: {str(e)}")
                        history_item["state"]["screenshot"] = None

        return processed_result
    except Exception as e:
        logger.error(f"Error processing result screenshots: {str(e)}", exc_info=True)
        return result


@router.websocket("/ws/browser")
async def websocket_browser_endpoint(websocket: WebSocket):
    """Handle WebSocket connections for browser automation."""
    await websocket.accept()
    session_id = None

    try:
        init_data = await websocket.receive_json()

        if init_data.get("type") == "init":
            config = BrowserConfigModel(**init_data.get("config", {}))
            session_id = str(uuid4())

            await websocket.send_json(
                {
                    "type": "init_response",
                    "session_id": session_id,
                    "status": "connected",
                }
            )

            context_config = BrowserContextConfig(highlight_elements=False)
            browser_instance = Browser()
            context_instance = BrowserContext(
                browser=browser_instance, config=context_config
            )
            browser_config = BrowserUseConfig(
                headless=config.headless, disable_security=config.disable_security
            )

            active_browser_sessions[session_id] = {
                "browser": browser_instance,
                "context": context_instance,
                "config": browser_config,
                "websocket": websocket,
                "history": [],
                "screenshots": [],
                "created_at": time.time(),
            }

            while True:
                message = await websocket.receive_json()
                message_type = message.get("type")

                if message_type == "task":
                    task = message.get("task")

                    if not task:
                        await websocket.send_json(
                            {
                                "type": "error",
                                "message": "No task provided",
                                "session_id": session_id,
                            }
                        )
                        continue

                    session = active_browser_sessions[session_id]

                    agent = EventAgent(
                        browser_context=session["context"],
                        task=task,
                        llm=llm,
                        session_id=session_id,
                        websocket=websocket,
                    )

                    session["history"].append({"role": "user", "content": task})

                    await websocket.send_json(
                        {"type": "task_started", "task": task, "session_id": session_id}
                    )

                    try:
                        result = await agent.run()

                        if agent.screenshots:
                            session["screenshots"].extend(agent.screenshots)

                        serializable_result = result.dict()
                        session["history"].append(
                            {"role": "assistant", "content": serializable_result}
                        )

                        # Process screenshots before sending the response
                        processed_result = await process_result_screenshots(
                            serializable_result, session_id
                        )
                        
                        # Add step history to result for better context
                        if not processed_result.get("step_history") and hasattr(agent, "step_history"):
                            processed_result["step_history"] = agent.step_history

                        await websocket.send_json(
                            {
                                "type": "task_completed",
                                "result": processed_result,
                                "session_id": session_id,
                                "screenshots": [],  # No need to send raw screenshots anymore
                            }
                        )
                    except Exception as e:
                        logger.error(f"Error executing task: {str(e)}", exc_info=True)
                        await websocket.send_json(
                            {
                                "type": "task_error",
                                "error": str(e),
                                "session_id": session_id,
                            }
                        )

                elif message_type == "close":
                    if session_id in active_browser_sessions:
                        await close_browser_session(session_id)
                        await websocket.send_json(
                            {
                                "type": "session_closed",
                                "session_id": session_id,
                            }
                        )
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected, session_id: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}", exc_info=True)
        try:
            if websocket.client_state != websocket.client_state.DISCONNECTED:
                await websocket.send_json(
                    {"type": "error", "message": str(e), "session_id": session_id}
                )
        except Exception as ws_error:
            logger.error(f"Failed to send error message to WebSocket: {str(ws_error)}")
    finally:
        if session_id and session_id in active_browser_sessions:
            await close_browser_session(session_id)


# Add this to your FastAPI app (main.py):
#
# @app.on_event("shutdown")
# async def shutdown_event():
#     from app.api.v1.routes.browser import active_browser_sessions
#
#     for session_id in list(active_browser_sessions.keys()):
#         try:
#             await close_browser_session(session_id)
#         except Exception as e:
#             logger.error(f"Error closing browser session during shutdown: {str(e)}")
