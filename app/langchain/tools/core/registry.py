from app.langchain.tools import (
    calendar_tool,
    code_exec_tool,
    document_tool,
    file_tools,
    flowchart_tool,
    goal_tool,
    google_docs_tool,
    image_tool,
    mail_tool,
    memory_tools,
    reminder_tool,
    search_tool,
    todo_tool,
    weather_tool,
    webpage_tool,
)

# Define tools that should always be accessible to the agent directly
ALWAYS_AVAILABLE_TOOLS = [
    search_tool.web_search_tool,
    search_tool.deep_search_tool,
    webpage_tool.fetch_webpages,
    file_tools.query_file,
]

# All other tools will be accessible through vector search
tools = [
    reminder_tool.create_reminder_tool,
    *mail_tool.tools,
    *todo_tool.tools,
    *calendar_tool.tools,
    *reminder_tool.tools,
    *google_docs_tool.tools,
    *memory_tools.tools,
    *goal_tool.tools,
    code_exec_tool.execute_code,
    flowchart_tool.create_flowchart,
    image_tool.generate_image,
    weather_tool.get_weather,
    document_tool.generate_document,
]
