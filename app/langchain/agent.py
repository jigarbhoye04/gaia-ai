import json
from datetime import datetime, timezone

from langchain_core.messages import AIMessageChunk, ToolMessage

from app.config.loggers import llm_logger as logger
from app.langchain.graph_builder import build_graph
from app.langchain.messages import (
    construct_langchain_messages,
)

from app.models.general_models import MessageRequestWithHistory
from app.utils.sse_utils import format_tool_response
from langsmith import traceable

graph = build_graph()

# display(
#     Image(
#         graph.get_graph().draw_mermaid_png(
#             draw_method=MermaidDrawMethod.API, max_retries=5, retry_delay=2.0
#         )
#     )
# )


@traceable
async def call_agent(
    request: MessageRequestWithHistory,
    conversation_id,
    user,
    access_token=None,
):
    user_id = user.get("user_id")
    messages = request.messages

    # messages[-1] = await add_file_content_to_message(
    #     messages[-1], message_request.fileIds, user_id
    # )
    history = construct_langchain_messages(messages)

    initial_state = {
        "messages": history,
        # "force_web_search": message_request.search_web,
        "force_web_search": True,
        "force_deep_search": request.deep_search,
        "current_datetime": datetime.now(timezone.utc).isoformat(),
    }

    llm_message = ""
    try:
        async for event in graph.astream(
            initial_state,
            stream_mode=["messages", "custom"],
            config={
                "configurable": {
                    "thread_id": conversation_id,
                    "user_id": user_id,
                    "access_token": access_token,
                },
                "recursion_limit": 10,
                "metadata": {"user_id": user_id},
            },
        ):
            stream_mode, payload = event
            if stream_mode == "messages":
                chunk, metadata = payload
                if chunk is None:
                    continue

                if isinstance(chunk, AIMessageChunk):
                    content = str(chunk.content)
                    yield f"data: {json.dumps({'response': chunk.content})}\n\n"
                    llm_message += content

                elif isinstance(chunk, ToolMessage):
                    logger.info(f"Tool message: {chunk.name} - {chunk.content}")
                    yield format_tool_response(
                        tool_name=chunk.name, content=str(chunk.content)
                    )

            elif stream_mode == "custom":
                yield f"data: {json.dumps(payload)}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    # try:
    #     # Handle storing the conversation and updating the database here
    #     await update_messages(
    #         UpdateMessagesRequest(
    #             conversation_id=conversation_id,
    #             messages=[
    #                 MessageModel(
    #                     type="user",
    #                     response=messages[-1]["content"],
    #                     date=datetime.now(timezone.utc).isoformat(),
    #                     searchWeb=message_request.search_web,
    #                     deepSearchWeb=message_request.deep_search,
    #                     pageFetchURLs=message_request.pageFetchURLs,
    #                     fileIds=message_request.fileIds,
    #                 ),
    #                 MessageModel(
    #                     type="bot",
    #                     response=llm_message,
    #                     date=datetime.now(timezone.utc).isoformat(),
    #                     searchWeb=message_request.search_web,
    #                     deepSearchWeb=message_request.deep_search,
    #                     pageFetchURLs=message_request.pageFetchURLs,
    #                     fileIds=message_request.fileIds,
    #                 ),
    #             ],
    #         ),
    #         user=user,
    #     )
    # except Exception as e:
    #     logger.error(f"Error updating messages: {e}")
    #     yield "data: {'error': 'Error updating messages'}\n\n"
    #     yield "data: [DONE]\n\n"

    # # try:
    #     # Handle storing the conversation and updating the database here
    #     await update_messages(
    #         UpdateMessagesRequest(
    #             conversation_id=conversation_id,
    #             messages=[
    #                 MessageModel(
    #                     type="user",
    #                     response=messages[-1]["content"],
    #                     date=datetime.now(timezone.utc).isoformat(),
    #                     searchWeb=message_request.search_web,
    #                     deepSearchWeb=message_request.deep_search,
    #                     pageFetchURLs=message_request.pageFetchURLs,
    #                     fileIds=message_request.fileIds,
    #                 ),
    #                 MessageModel(
    #                     type="bot",
    #                     response=llm_message,
    #                     date=datetime.now(timezone.utc).isoformat(),
    #                     searchWeb=message_request.search_web,
    #                     deepSearchWeb=message_request.deep_search,
    #                     pageFetchURLs=message_request.pageFetchURLs,
    #                     fileIds=message_request.fileIds,
    #                 ),
    #             ],
    #         ),
    #         user=user,
    #     )
    # except Exception as e:
    #     logger.error(f"Error updating messages: {e}")
    #     yield "data: {'error': 'Error updating messages'}\n\n"
    yield "data: [DONE]\n\n"
