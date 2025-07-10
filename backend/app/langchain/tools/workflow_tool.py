"""Structured workflow generation tool using Langchain."""

from typing import Dict, Any, Optional
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import PromptTemplate

from app.models.workflow_models import WorkflowPlan
from app.config.loggers import todos_logger as logger
from app.langchain.llm.client import init_llm
from app.langchain.tools.core.registry import tool_names


async def generate_workflow_plan(
    todo_title: str, todo_description: str = ""
) -> WorkflowPlan:
    """
    Generate a structured workflow plan for a TODO item using available tools.

    Creates 2-4 actionable steps that can be completed with available tools including:
    - mail (email operations)
    - calendar (scheduling, events)
    - search (web search, research)
    - productivity (todos, reminders)
    - documents (file operations)
    - weather (weather information)
    - goal_tracking (goal management)
    g
    Args:
        todo_title: The title of the TODO item
        todo_description: Optional description providing more context

    Returns:
        WorkflowPlan: Structured workflow with actionable steps
    """

    try:
        # Create the parser for structured output
        parser = PydanticOutputParser(pydantic_object=WorkflowPlan)

        logger.info(f"Generating workflow for: {todo_title}")
        # Create structured prompt with format instructions
        prompt_template = PromptTemplate(
            template="""Create a practical workflow plan for this TODO task using ONLY the available tools listed below.

            TODO: {todo_title}
            Description: {todo_description}

            CRITICAL REQUIREMENTS:
            1. Use ONLY the exact tool names listed above - do not make up or modify tool names
            2. Choose tools that are logically appropriate for the task
            3. Each step must specify tool_name using the EXACT name from the list above
            4. Consider the tool category when selecting appropriate tools
            5. Use actionable and proper tools that help accomplish the task at hand, no useless tools or doing things that are unnecessary.

            Create 4-7 actionable steps that logically break down this TODO into smaller, executable tasks.

            GOOD WORKFLOW EXAMPLES:
            - "Plan vacation" → 1) web_search_tool (research destinations), 2) get_weather (check climate), 3) create_calendar_event (schedule trip)
            - "Organize emails" → 1) search_gmail_messages (find relevant emails), 2) create_gmail_label (create organization), 3) apply_labels_to_emails (organize)
            - "Submit report" → 1) generate_document (create report), 2) create_calendar_event (schedule deadline), 3) create_reminder (set reminder)

            Available Tools:
            {tools}

            {format_instructions}
            """,
            input_variables=["todo_title", "todo_description", "tools"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )

        # Initialize LLM
        llm = init_llm(streaming=False)

        # Create chain: prompt | llm | parser
        chain = prompt_template | llm | parser

        # Generate workflow plan
        workflow_plan = await chain.ainvoke(
            {
                "todo_title": todo_title,
                "todo_description": todo_description or "No description provided",
                "tools": tool_names,
            }
        )

        # Ensure the title includes the todo title if not already present
        if todo_title not in workflow_plan.title:
            workflow_plan.title = f"Workflow for: {todo_title}"

        logger.info(
            f"Generated structured workflow for '{todo_title}' with {len(workflow_plan.steps)} steps"
        )
        return workflow_plan

    except Exception as e:
        logger.error(f"Error in structured workflow generation: {str(e)}")
        raise e


async def generate_workflow_for_todo(
    todo_title: str, todo_description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate a workflow plan for a TODO item using structured output.

    Args:
        todo_title: Title of the TODO item
        todo_description: Optional description of the TODO item

    Returns:
        Dict containing success status and workflow data
    """
    try:
        workflow_plan = await generate_workflow_plan(todo_title, todo_description or "")

        return {"success": True, "workflow": workflow_plan.dict()}

    except Exception as e:
        logger.error(f"Failed to generate workflow for TODO '{todo_title}': {str(e)}")
        return {"success": False, "error": str(e)}
