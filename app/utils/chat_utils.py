from typing import List
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)

from app.langchain.state import State
from app.langchain.messages import LangChainMessageType
from app.config.loggers import chat_logger as logger
# # GROQ_MODEL = "llama-3.1-8b-instant"
# # GROQ_MODEL = "llama-3.3-70b-versatile"
# GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
# # GROQ_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct"

# tools = [
#     fetch_tool.fetch_webpages,
#     search_tool.deep_search,
#     search_tool.web_search,
#     memory_tool.create_memory,
#     weather_tool.get_weather,
#     calendar_tool.fetch_calendar_list,
#     calendar_tool.calendar_event,
#     flowchart_tool.create_flowchart,
#     image_tool.generate_image,
# ]

# # Creating the chat model and binding the tools
# groq_llm = ChatGroq(
#     model=GROQ_MODEL,
#     api_key=settings.GROQ_API_KEY,
#     temperature=0.6,
#     max_tokens=2048,
#     streaming=True,
# )
# groq_llm = groq_llm.bind_tools(
#     tools=tools,
# )

# # Default chat model
# # default_llm = DefaultChatAgent(
# #     # model="@cf/meta/llama-3.1-8b-instruct-fast",
# #     model="@cf/meta/llama-3.3-70b-versatile",
# #     temperature=0.6,
# #     max_tokens=2048,
# # )
# # default_llm = default_llm.bind_tools(
# #     tools=tools,
# # )


# # Define the state for the StateGraph
# class State(TypedDict):
#     messages: Annotated[list, add_messages]
#     force_web_search: bool
#     force_deep_search: bool
#     current_datetime: str


# # Create the state graph builder
# graph_builder = StateGraph(State)


# async def chatbot(
#     state: State,
# ):
#     """Chatbot function that uses the state graph and model."""
#     try:
#         # Try to call the Groq API with the provided messages
#         response = await groq_llm.ainvoke(state["messages"])
#         return {"messages": [response]}
#     except Exception as e:
#         logger.error(f"Error in Groq API call: {str(e)}")

#         return {
#             "messages": [
#                 AIMessage(
#                     content="I'm having trouble processing your request. Please try again with a simpler query."
#                 )
#             ]
#         }


# graph_builder.add_node("chatbot", chatbot)
# graph_builder.add_node("tools", ToolNode(tools=tools))

# graph_builder.add_edge(START, "chatbot")
# graph_builder.add_edge("chatbot", END)
# graph_builder.add_edge("tools", "chatbot")

# graph_builder.add_conditional_edges(
#     "chatbot",
#     tools_condition,
# )

# # TODO: Use sqlite to store the state graph instead of in-memory
# graph = graph_builder.compile(checkpointer=MemorySaver())


# def construct_langchain_messages(messages):
#     langchain_messages = []

#     # Format current datetime for the template
#     current_time = datetime.now(timezone.utc)
#     formatted_time = current_time.strftime("%A, %B %d, %Y, %H:%M:%S UTC")

#     # Apply the template with the current datetime
#     system_prompt = AGENT_PROMPT_TEMPLATE.format(current_datetime=formatted_time)
#     langchain_messages.append(SystemMessage(system_prompt))

#     for msg in messages:
#         if msg.get("role") == "user":
#             langchain_messages.append(HumanMessage(content=msg.get("content", "")))
#         elif msg.get("role") in ["assistant", "bot"]:
#             langchain_messages.append(AIMessage(content=msg.get("content", "")))

#     return langchain_messages


# async def do_prompt_with_stream(
#     messages: list,
#     conversation_id,
#     user_id,
#     access_token=None,
# ):
#     """Send a prompt to the LLM API with streaming enabled."""

#     message_history = construct_langchain_messages(messages)

#     # Create initial state with current date and time
#     initial_state = {
#         "messages": message_history,
#         "force_web_search": False,
#         "force_deep_search": False,
#         "current_datetime": datetime.now(timezone.utc).isoformat(),
#     }

#     try:
#         # Stream events from the graph
#         async for event in graph.astream(
#             initial_state,
#             stream_mode=["messages"],
#             config={
#                 "configurable": {
#                     "thread_id": conversation_id,
#                     "user_id": user_id,
#                     "access_token": access_token if access_token else None,
#                 },
#                 "recursion_limit": 10,
#                 "metadata": {"user_id": user_id},
#             },
#         ):
#             # Unpack the properties from the event
#             _, (chunk, metadata) = event

#             # If the chunk is a message from the agent
#             if isinstance(chunk, AIMessageChunk):
#                 yield f"data: {json.dumps({'response': chunk.content})}\n\n"

#             # If the chunk is output of a tool
#             if isinstance(chunk, ToolMessage):
#                 try:
#                     yield format_tool_response(
#                         tool_name=chunk.name,
#                         content=str(chunk.content),
#                     )
#                 except Exception as tool_error:
#                     logger.error(f"Error formatting tool response: {tool_error}")
#                     yield f"data: {json.dumps({'error': f'Error processing {chunk.name} response'})}\n\n"

#         # Signal completion of the stream
#         yield "data: [DONE]\n\n"

#     except Exception as e:
#         logger.error(f"Graph model error: {e}")
#         yield f"data: {json.dumps({'error': str(e)})}\n\n"
#         yield "data: [DONE]\n\n"


async def do_prompt_no_stream(
    prompt: str,
    system_prompt: str | None = None,
    use_tools: bool = False,
) -> dict:
    # Import the chatbot function only when needed to prevent circular imports
    from app.langchain.chatbot import chatbot

    messages: List[LangChainMessageType] = (
        [SystemMessage(content=system_prompt)] if system_prompt else []
    )
    messages.append(HumanMessage(content=prompt))

    state = State({"messages": messages})

    response = await chatbot(state, use_tools)

    # Extract the AI's response content
    ai_message = response["messages"][0]
    logger.info(f"this is the ai message {ai_message}")
    return {"response": ai_message.content}
