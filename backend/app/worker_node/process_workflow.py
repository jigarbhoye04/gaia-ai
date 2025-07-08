"""
Background task processor for workflow generation.
"""

from typing import Dict, Any
from datetime import datetime, timezone

from bson import ObjectId

from app.config.loggers import worker_logger as logger
from app.db.mongodb.collections import todos_collection
from app.services.todo_service import TodoService
from app.models.todo_models import WorkflowStatus


async def process_workflow_generation(task_data: Dict[str, Any]) -> None:
    """
    Process workflow generation task in the background.

    Args:
        task_data: Dictionary containing todo_id, user_id, title, and description
    """
    try:
        todo_id = task_data.get("todo_id")
        user_id = task_data.get("user_id")
        title = task_data.get("title")
        description = task_data.get("description")

        if not all([todo_id, user_id, title]):
            logger.error(f"Missing required fields in workflow task data: {task_data}")
            return

        logger.info(f"Starting workflow generation for todo {todo_id}: {title}")

        # Generate workflow using the existing method
        workflow_result = await TodoService._generate_workflow_for_todo(
            title, description
        )

        if workflow_result.get("success"):
            # Update the todo with the generated workflow
            update_data = {
                "workflow": workflow_result["workflow"],
                "workflow_status": WorkflowStatus.COMPLETED,
                "updated_at": datetime.now(timezone.utc),
            }

            result = await todos_collection.update_one(
                {"_id": ObjectId(todo_id), "user_id": user_id}, {"$set": update_data}
            )

            if result.modified_count > 0:
                logger.info(
                    f"Successfully generated and saved workflow for todo {todo_id} with {len(workflow_result['workflow'].get('steps', []))} steps"
                )

                # Invalidate cache for this todo
                await TodoService._invalidate_cache(user_id, None, todo_id, "update")
            else:
                logger.warning(f"Todo {todo_id} not found or not updated with workflow")

        else:
            # Mark workflow generation as failed
            failed_update_data = {
                "workflow_status": WorkflowStatus.FAILED,
                "updated_at": datetime.now(timezone.utc),
            }

            await todos_collection.update_one(
                {"_id": ObjectId(todo_id), "user_id": user_id},
                {"$set": failed_update_data},
            )

            logger.error(
                f"Failed to generate workflow for todo {todo_id}: {workflow_result.get('error', 'Unknown error')}"
            )

    except Exception as e:
        # Mark workflow generation as failed on exception
        try:
            todo_id = task_data.get("todo_id")
            user_id = task_data.get("user_id")
            if todo_id and user_id:
                failed_update_data = {
                    "workflow_status": WorkflowStatus.FAILED,
                    "updated_at": datetime.now(timezone.utc),
                }

                await todos_collection.update_one(
                    {"_id": ObjectId(todo_id), "user_id": user_id},
                    {"$set": failed_update_data},
                )
        except Exception as update_error:
            logger.error(
                f"Failed to update workflow status to failed: {str(update_error)}"
            )

        logger.error(
            f"Error processing workflow generation task: {str(e)}", exc_info=True
        )
