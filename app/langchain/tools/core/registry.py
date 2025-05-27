from app.langchain.tools import (
    calendar_tool,
    file_tools,
    flowchart_tool,
    image_tool,
    mail_tool,
    memory_tools,
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
    *mail_tool.mail_tools,
    *todo_tool.todo_tools,
    calendar_tool.fetch_calendar_list,
    calendar_tool.calendar_event,
    flowchart_tool.create_flowchart,
    image_tool.generate_image,
    weather_tool.get_weather,
    memory_tools.add_memory,
    memory_tools.search_memory,
    memory_tools.get_all_memory,
]
