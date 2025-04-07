import asyncio
import time
from typing import Dict, List, Optional, Any
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
from pydantic import BaseModel, Field

from app.config.loggers import app_logger as logger
from app.config.settings import settings

load_dotenv()


router = APIRouter()


llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY
)


active_browser_sessions: Dict[str, Dict[str, Any]] = {}


class BrowserConfigModel(BaseModel):
    headless: bool = False
    disable_security: bool = True


class ConversationMessage(BaseModel):
    role: str
    content: Any
    timestamp: float = Field(default_factory=time.time)


class ConversationState(BaseModel):
    messages: List[ConversationMessage] = []
    current_url: Optional[str] = None
    page_title: Optional[str] = None
    last_screenshot_url: Optional[str] = None


class EventAgent(Agent):
    def __init__(
        self,
        browser_context,
        task,
        llm,
        session_id=None,
        websocket=None,
        conversation_history=None,
    ):
        self.session_id = session_id
        self.websocket = websocket
        self.loop = asyncio.get_event_loop()
        self.screenshots = []
        self.current_step = 0
        self.step_history = []  # Store history of steps for final message
        self.conversation_history = conversation_history or []

        async def new_step_callback(
            state: BrowserState,
            model_output: AgentOutput,
            steps: int,
        ):
            logger.info("Processing browser step callback")

            thoughts = {
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

            logger.debug(
                "Step update sent",
                {
                    "type": "step_update",
                    "data": step_data,
                    "session_id": self.session_id,
                },
            )

        super().__init__(
            browser_context=browser_context,
            task=task,
            llm=llm,
            register_new_step_callback=new_step_callback,
        )

    async def run(self):
        """Override the run method to include conversation history in task context."""
        # If we have conversation history, include it in the task context
        if self.conversation_history:
            # Create a summary of the conversation history to inform the current task
            history_context = await self._generate_conversation_context()

            # Enhance the task with the conversation context if it exists
            if history_context:
                enhanced_task = f"""Previous conversation context:
{history_context}

Current task: {self.task}

Continue with the current task in the context of the previous conversation."""
                self.task = enhanced_task
                logger.info("Enhanced task with conversation history context")

        # Call the original run method from the parent class
        result = await super().run()

        # Generate and add summary of the current operation
        try:
            if self.step_history:
                summary = await self._generate_history_summary()

                # Add the summary to the result if possible
                if hasattr(result, "add_summary"):
                    result.add_summary(summary)
                elif hasattr(result, "history") and result.history:
                    # Try to add to the last history item
                    last_item = result.history[-1]
                    if hasattr(last_item, "model_output") and hasattr(
                        last_item.model_output, "current_state"
                    ):
                        last_item.model_output.current_state.memory += (
                            f"\n\nHistory Summary: {summary}"
                        )
        except Exception as e:
            logger.error(f"Error adding step history summary: {str(e)}", exc_info=True)

        return result

    async def _generate_conversation_context(self):
        """Generate a summary of previous conversation to provide context for the current task."""
        try:
            if not self.conversation_history:
                return ""

            # Create a concise history representation for the LLM
            history_text = "\n\n".join(
                [
                    f"{msg.get('role', 'unknown').capitalize()}: {msg.get('content', '')}"
                    for msg in self.conversation_history[
                        -5:
                    ]  # Limit to last 5 exchanges
                ]
            )

            prompt = f"""Summarize the following browser conversation history to provide context for the next task:

{history_text}

Provide a concise summary that captures key information the agent needs to remember, including:
1. Important URLs visited
2. Information collected or actions completed
3. Context that's important for continuing the current process
"""

            # Use the LLM to generate a summary
            response = await self.llm.apredict(prompt)
            return response
        except Exception as e:
            logger.error(
                f"Error generating conversation context: {str(e)}", exc_info=True
            )
            return ""

    async def _generate_history_summary(self):
        """Generate a summary of the step history for the agent to use."""
        try:
            if not self.step_history:
                return ""

            # Create a prompt for the LLM to summarize the history
            history_text = "\n\n".join(
                [
                    f"Step {step.get('step')}: "
                    f"URL: {step.get('url')} | "
                    f"Title: {step.get('title')} | "
                    f"Evaluation: {step.get('thoughts', {}).get('evaluation')} | "
                    f"Memory: {step.get('thoughts', {}).get('memory')} | "
                    f"Next Goal: {step.get('thoughts', {}).get('next_goal')}"
                    for step in self.step_history
                ]
            )

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


async def get_conversation_examples(conversation_history: List[dict]) -> str:
    """Generate example follow-up commands based on conversation history."""
    if not conversation_history:
        return "Examples: 'Go to google.com' or 'Search for latest news'"

    try:
        # Get the most recent exchange
        if len(conversation_history) >= 2:
            last_user_msg = next(
                (
                    msg
                    for msg in reversed(conversation_history)
                    if msg.get("role") == "user"
                ),
                None,
            )
            last_assistant_msg = next(
                (
                    msg
                    for msg in reversed(conversation_history)
                    if msg.get("role") == "assistant"
                ),
                None,
            )

            if last_user_msg and last_assistant_msg:
                # Create a prompt for the LLM to generate examples
                prompt = f"""Based on this recent browser conversation:

User: {last_user_msg.get("content", "")}

Agent completed the task.

Generate 3 brief, natural follow-up commands the user might want to do next.
Format each as a short, direct command (1-5 words), separated by newlines.
"""

                examples = await llm.apredict(prompt)
                if examples:
                    formatted_examples = examples.strip().split("\n")
                    return f"Follow-up examples: {', '.join(formatted_examples[:3])}"

        return "You can continue by sending another command like 'click on the first link' or 'go back'"
    except Exception as e:
        logger.error(f"Error generating conversation examples: {str(e)}", exc_info=True)
        return "You can continue by sending another task to the browser agent"


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
                    "capabilities": {
                        "multi_turn_conversation": True,
                        "message_types": ["task", "get_conversation", "close"],
                    },
                    "usage_info": "You can send multiple commands in sequence by sending 'task' messages to this connection.",
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
                "conversation_state": ConversationState(),
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

                    # Pass the conversation history to the agent
                    agent = EventAgent(
                        browser_context=session["context"],
                        task=task,
                        llm=llm,
                        session_id=session_id,
                        websocket=websocket,
                        conversation_history=session["history"],
                    )

                    # Add the user message to history
                    session["history"].append({"role": "user", "content": task})

                    await websocket.send_json(
                        {
                            "type": "task_started",
                            "task": task,
                            "session_id": session_id,
                            "conversation_turn": len(session["history"]),
                        }
                    )

                    try:
                        result = await agent.run()

                        if agent.screenshots:
                            session["screenshots"].extend(agent.screenshots)

                        serializable_result = result.dict()

                        # Update conversation history with assistant response
                        session["history"].append(
                            {"role": "assistant", "content": serializable_result}
                        )

                        # Update conversation state
                        if agent.step_history and len(agent.step_history) > 0:
                            last_step = agent.step_history[-1]
                            session["conversation_state"].current_url = last_step.get(
                                "url"
                            )
                            session["conversation_state"].page_title = last_step.get(
                                "title"
                            )
                            if "screenshot_url" in last_step:
                                session[
                                    "conversation_state"
                                ].last_screenshot_url = last_step.get("screenshot_url")

                        # Process screenshots before sending the response
                        processed_result = await process_result_screenshots(
                            serializable_result, session_id
                        )

                        # Add step history to result for better context
                        if not processed_result.get("step_history") and hasattr(
                            agent, "step_history"
                        ):
                            processed_result["step_history"] = agent.step_history

                        # Get follow-up examples to suggest to the user
                        follow_up_examples = await get_conversation_examples(
                            session["history"]
                        )

                        await websocket.send_json(
                            {
                                "type": "task_completed",
                                "result": processed_result,
                                "session_id": session_id,
                                "conversation_turn": len(session["history"]),
                                "current_state": {
                                    "url": session["conversation_state"].current_url,
                                    "title": session["conversation_state"].page_title,
                                    "screenshot": session[
                                        "conversation_state"
                                    ].last_screenshot_url,
                                },
                                "conversation_length": len(session["history"]),
                                "follow_up_suggestions": follow_up_examples,
                                "waiting_for_next_command": True,
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

                elif message_type == "get_conversation":
                    # Return the current conversation history
                    if session_id in active_browser_sessions:
                        session = active_browser_sessions[session_id]

                        # Filter out large data like screenshots from the response
                        filtered_history = []
                        for msg in session["history"]:
                            if msg["role"] == "assistant" and isinstance(
                                msg["content"], dict
                            ):
                                # For assistant messages, filter large content
                                filtered_content = {
                                    k: v
                                    for k, v in msg["content"].items()
                                    if k not in ["raw_screenshots", "full_html"]
                                }
                                filtered_history.append(
                                    {"role": msg["role"], "content": filtered_content}
                                )
                            else:
                                filtered_history.append(msg)

                        await websocket.send_json(
                            {
                                "type": "conversation_history",
                                "history": filtered_history,
                                "session_id": session_id,
                                "current_state": {
                                    "url": session["conversation_state"].current_url,
                                    "title": session["conversation_state"].page_title,
                                    "screenshot": session[
                                        "conversation_state"
                                    ].last_screenshot_url,
                                },
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
