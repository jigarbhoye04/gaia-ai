from __future__ import annotations

import json
from typing import (
    Any,
    Callable,
    Dict,
    Iterator,
    List,
    Literal,
    Optional,
    Sequence,
    Type,
    Union,
)

import httpx
from langchain_core.callbacks import (
    CallbackManagerForLLMRun,
)
from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.messages import (
    AIMessage,
    AIMessageChunk,
    BaseMessage,
)
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.runnables import Runnable
from langchain_core.tools import BaseTool
from langchain_core.utils.function_calling import (
    convert_to_openai_tool,
)
from pydantic import (
    BaseModel,
    Field,
)

from app.config.loggers import llm_logger as logger
from app.config.settings import settings

http_async_client = httpx.AsyncClient(timeout=1000000)
http_sync_client = httpx.Client(timeout=1000000)


class DefaultChatAgent(BaseChatModel):
    """A default chat agent.

    Example:
        ```python
        from app.utils.llm_utils import DefaultChatAgent
        agent = DefaultChatAgent()

        response = await agent.ainvoke(messages=[{"role": "user", "content": "Hello!"}])
        ```
    """

    model_name: str = Field(alias="model")
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    max_retries: int = 2

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        try:
            response = http_sync_client.post(
                settings.LLM_URL,
                json={
                    "model": self.model_name,
                    "messages": self._covert_messages_to_supported_format(messages),
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stream": "false",
                },
            )

            response.raise_for_status()
            response_data = response.json()

            message = AIMessage(
                content=response_data["response"],
                additional_kwargs={},
                response_metadata={
                    "time_in_seconds": 3,
                    "model_name": self.model_name,
                },
                usage_metadata={
                    "input_tokens": response_data["usage"]["prompt_tokens"],
                    "output_tokens": response_data["usage"]["completion_tokens"],
                    "total_tokens": response_data["usage"]["total_tokens"],
                },
            )

            generation = ChatGeneration(message=message)
            return ChatResult(generations=[generation])
        except Exception as e:
            logger.error(f"Error in _generate: {e}")
            raise

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        """Stream the output of the model.

        This method should be implemented if the model can generate output
        in a streaming fashion. If the model does not support streaming,
        do not implement it. In that case streaming requests will be automatically
        handled by the _generate method.

        Args:
            messages: the prompt composed of a list of messages.
        """
        try:
            with http_sync_client.stream(
                "POST",
                settings.LLM_URL,
                json={
                    "model": self.model_name,
                    "messages": self._covert_messages_to_supported_format(messages),
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stream": "true",
                },
            ) as response:
                response.raise_for_status()

                accumulated_content = ""

                for line in response.iter_lines():
                    if not line:
                        continue

                    # Parse the JSON response from the server
                    content = line.removeprefix("data:").strip()
                    if content == "[DONE]":
                        break

                    try:
                        chunk_data = json.loads(content)
                        chunk_content = chunk_data.get("content", "")
                        accumulated_content += chunk_content

                        chunk = ChatGenerationChunk(
                            message=AIMessageChunk(
                                content=chunk_content,
                            )
                        )

                        yield chunk
                    except json.JSONDecodeError:
                        logger.error(f"Error decoding JSON from stream: {content}")
                        continue
        except Exception as e:
            logger.error(f"Error in _stream: {e}")
            raise

    async def _agenerate(
        self,
        messages,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ):
        try:
            """Asynchronous version of the _generate method."""
            response = await http_async_client.post(
                settings.LLM_URL,
                json={
                    "model": self.model_name,
                    "messages": self._covert_messages_to_supported_format(messages),
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stream": "false",
                },
            )

            response.raise_for_status()
            response_data = response.json()

            message = AIMessage(
                content=response_data["response"],
                additional_kwargs={},
                response_metadata={
                    "time_in_seconds": 3,
                    "model_name": self.model_name,
                },
                usage_metadata={
                    "input_tokens": response_data["usage"]["prompt_tokens"],
                    "output_tokens": response_data["usage"]["completion_tokens"],
                    "total_tokens": response_data["usage"]["total_tokens"],
                },
            )

            generation = ChatGeneration(message=message)
            return ChatResult(generations=[generation])
        except Exception as e:
            logger.error(f"Error in _agenerate: {e}")
            raise

    async def _astream(
        self,
        messages,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ):
        """Asynchronous version of the _stream method."""
        try:
            async with http_async_client.stream(
                "POST",
                settings.LLM_URL,
                json={
                    "model": self.model_name,
                    "messages": self._covert_messages_to_supported_format(messages),
                    "temperature": self.temperature,
                    "max_tokens": self.max_tokens,
                    "stream": "true",
                },
            ) as response:
                response.raise_for_status()

                accumulated_content = ""

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    # Parse the JSON response from the server
                    content = line.removeprefix("data:").strip()
                    if content == "[DONE]":
                        break

                    try:
                        chunk_data = json.loads(content)
                        chunk_content = chunk_data.get("content", "")
                        accumulated_content += chunk_content

                        chunk = ChatGenerationChunk(
                            message=AIMessageChunk(
                                content=chunk_content,
                            )
                        )

                        yield chunk
                    except json.JSONDecodeError:
                        logger.error(f"Error decoding JSON from stream: {content}")
                        continue
        except Exception as e:
            logger.error(f"Error in _astream: {e}")
            raise

    @property
    def _llm_type(self) -> str:
        """Get the type of language model used by this chat model."""
        return "echoing-chat-model-advanced"  # Don't know what to put here

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Return a dictionary of identifying parameters.

        This information is used by the LangChain callback system, which
        is used for tracing purposes make it possible to monitor LLMs.
        """
        return {
            # The model name allows users to specify custom token counting
            # rules in LLM monitoring applications (e.g., in LangSmith users
            # can provide per token pricing for their model and monitor
            # costs for the given LLM.)
            "model_name": self.model_name,
        }

    def bind_tools(
        self,
        tools: Sequence[Union[Dict[str, Any], Type[BaseModel], Callable, BaseTool]],
        *,
        tool_choice: Optional[
            Union[dict, str, Literal["auto", "any", "none"], bool]
        ] = None,
        **kwargs: Any,
    ) -> Runnable[LanguageModelInput, BaseMessage]:
        """Bind tool-like objects to this chat model.

        Args:
            tools: A list of tool definitions to bind to this chat model.
                Supports any tool definition handled by
                :meth:`langchain_core.utils.function_calling.convert_to_openai_tool`.
            tool_choice: Which tool to require the model to call.
                Must be the name of the single provided function,
                "auto" to automatically determine which function to call
                with the option to not call any function, "any" to enforce that some
                function is called, or a dict of the form:
                {"type": "function", "function": {"name": <<tool_name>>}}.
            **kwargs: Any additional parameters to pass to the
                :class:`~langchain.runnable.Runnable` constructor.
        """

        formatted_tools = [convert_to_openai_tool(tool) for tool in tools]
        if tool_choice is not None and tool_choice:
            if tool_choice == "any":
                tool_choice = "required"
            if isinstance(tool_choice, str) and (
                tool_choice not in ("auto", "none", "required")
            ):
                tool_choice = {"type": "function", "function": {"name": tool_choice}}
            if isinstance(tool_choice, bool):
                if len(tools) > 1:
                    raise ValueError(
                        "tool_choice can only be True when there is one tool. Received "
                        f"{len(tools)} tools."
                    )
                tool_name = formatted_tools[0]["function"]["name"]
                tool_choice = {
                    "type": "function",
                    "function": {"name": tool_name},
                }

            kwargs["tool_choice"] = tool_choice
        return super().bind(tools=formatted_tools, **kwargs)

    def _covert_message_to_supported_format(
        self,
        message: BaseMessage,
    ) -> Dict[str, Any]:
        """Translate a message to the format expected by the model."""
        return {
            "role": message.type,
            "content": message.content,
        }

    def _covert_messages_to_supported_format(
        self,
        messages: List[BaseMessage],
    ) -> List[Dict[str, Any]]:
        """Translate a list of messages to the format expected by the model."""
        return [
            self._covert_message_to_supported_format(message) for message in messages
        ]
