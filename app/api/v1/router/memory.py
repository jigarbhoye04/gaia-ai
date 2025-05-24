"""Memory management API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.v1.dependencies.oauth_dependencies import get_current_user
from app.memory.service import memory_service
from app.memory.models import MemorySearchResult

router = APIRouter(prefix="/memory", tags=["Memory"])


class CreateMemoryRequest(BaseModel):
    """Request model for creating a memory."""
    content: str = Field(description="The memory content to store")
    metadata: Optional[dict] = Field(default=None, description="Optional metadata")


class CreateMemoryResponse(BaseModel):
    """Response model for memory creation."""
    success: bool
    memory_id: Optional[str] = None
    message: str


class DeleteMemoryResponse(BaseModel):
    """Response model for memory deletion."""
    success: bool
    message: str


@router.get("/all", response_model=MemorySearchResult)
async def get_all_memories(
    page: int = 1,
    page_size: int = 20,
    user: dict = Depends(get_current_user),
):
    """
    Get all memories for the current user with pagination.
    
    Args:
        page: Page number (default: 1)
        page_size: Number of memories per page (default: 20)
        user: Current authenticated user
        
    Returns:
        MemorySearchResult with paginated memories
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    return await memory_service.get_all_memories(
        user_id=user_id,
        page=page,
        page_size=page_size
    )


@router.post("/create", response_model=CreateMemoryResponse)
async def create_memory(
    request: CreateMemoryRequest,
    user: dict = Depends(get_current_user),
):
    """
    Create a new memory for the current user.
    
    Args:
        request: Memory creation request
        user: Current authenticated user
        
    Returns:
        CreateMemoryResponse with success status
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    memory_entry = await memory_service.store_memory(
        content=request.content,
        user_id=user_id,
        metadata=request.metadata
    )
    
    if memory_entry:
        return CreateMemoryResponse(
            success=True,
            memory_id=memory_entry.id,
            message="Memory created successfully"
        )
    else:
        return CreateMemoryResponse(
            success=False,
            message="Failed to create memory"
        )


@router.delete("/{memory_id}", response_model=DeleteMemoryResponse)
async def delete_memory(
    memory_id: str,
    user: dict = Depends(get_current_user),
):
    """
    Delete a specific memory.
    
    Args:
        memory_id: ID of the memory to delete
        user: Current authenticated user
        
    Returns:
        DeleteMemoryResponse with success status
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    success = await memory_service.delete_memory(
        memory_id=memory_id,
        user_id=user_id
    )
    
    if success:
        return DeleteMemoryResponse(
            success=True,
            message="Memory deleted successfully"
        )
    else:
        return DeleteMemoryResponse(
            success=False,
            message="Failed to delete memory"
        )


@router.delete("/all/clear", response_model=DeleteMemoryResponse)
async def clear_all_memories(
    user: dict = Depends(get_current_user),
):
    """
    Clear all memories for the current user.
    
    Args:
        user: Current authenticated user
        
    Returns:
        DeleteMemoryResponse with success status
    """
    user_id = user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")
    
    try:
        # Get all memories and delete them one by one
        # (Mem0 doesn't have a bulk delete, so we iterate)
        all_memories = await memory_service.get_all_memories(
            user_id=user_id,
            page=1,
            page_size=100  # Get first 100 memories
        )
        
        deleted_count = 0
        for memory in all_memories.memories:
            if memory.id:
                success = await memory_service.delete_memory(
                    memory_id=memory.id,
                    user_id=user_id
                )
                if success:
                    deleted_count += 1
        
        # Handle remaining memories if more than 100
        while all_memories.has_next:
            all_memories = await memory_service.get_all_memories(
                user_id=user_id,
                page=all_memories.page + 1,
                page_size=100
            )
            for memory in all_memories.memories:
                if memory.id:
                    success = await memory_service.delete_memory(
                        memory_id=memory.id,
                        user_id=user_id
                    )
                    if success:
                        deleted_count += 1
        
        return DeleteMemoryResponse(
            success=True,
            message=f"Cleared {deleted_count} memories successfully"
        )
    except Exception as e:
        return DeleteMemoryResponse(
            success=False,
            message=f"Failed to clear memories: {str(e)}"
        )