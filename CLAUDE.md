# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GAIA (General-purpose AI assistant) is a FastAPI backend that powers [heygaia.io](https://heygaia.io). It's built using FastAPI for high-performance, asynchronous API handling and integrates various AI capabilities through LangChain.

## Development Setup Commands

### Environment Setup

```sh
# Install dependencies using UV
uv sync

# Install only core dependencies
uv sync --only-group core

# Install only heavy dependencies
uv sync --only-group heavy

# Add a new dependency
uv add <package-name>

# Add a dependency to a specific group
uv add <package-name> --group <group-name>

# Install pre-commit hooks
pre-commit install
```

### Running the Application

```sh
# Start development environment with Docker Compose
docker compose up --build

# Start without rebuilding
docker compose up

# Start production environment
docker compose -f docker-compose.prod.yml up --build -d

# Start production with Celery workers
docker compose -f docker-compose.prod.yml --profile celery up --build

# Stop and remove containers (development)
docker compose down

# Stop and remove containers (production with Celery)
docker compose -f docker-compose.prod.yml --profile celery down
```

### Code Quality

```sh
# Run Ruff linter
uvx ruff check

# Run pre-commit checks on all files
pre-commit run --all-files
```

## Streaming and Tool Data Persistence

### Email Compose Data Issue (Fixed)
- **Problem**: Email compose components were visible during streaming but disappeared after stream completion
- **Root Cause**: Email data wasn't being extracted and stored in backend like other tool outputs (calendar, weather, etc.)
- **Fix Applied**:
  1. Added email data extraction in `chat_service.py:extract_tool_data()` function
  2. Updated frontend `useChatStream.ts:handleStreamClose()` to preserve email data when stream ends
- **Files Modified**:
  - `/app/services/chat_service.py` - Added email compose data extraction
  - Frontend: `/src/hooks/useChatStream.ts` - Preserved tool data on stream close

### Tool Data Flow
1. LLM generates tool response → `sse_utils.py:format_tool_response()` formats for streaming
2. During streaming → `chat_service.py:extract_tool_data()` extracts structured data
3. Stream ends → `chat_service.py:update_conversation_messages()` saves to database
4. Frontend preserves tool data in `useChatStream.ts:handleStreamClose()`

### Adding New Tool Data Types
To add a new tool data type (similar to email/calendar):
1. Add formatting in `sse_utils.py:format_tool_response()`
2. Add extraction in `chat_service.py:extract_tool_data()`
3. Add frontend parsing in `useStreamDataParser.ts:parseStreamData()`
4. Add preservation in `useChatStream.ts:handleStreamClose()`

## Architecture Overview

### Application Structure

The GAIA backend follows a layered architecture:

1. **API Layer** (`app/api/v1/router/`):
   - REST endpoints organized by domain (chat, mail, calendar, etc.)
   - Authentication via OAuth dependencies
   - Clean route handlers that delegate to service functions

2. **Service Layer** (`app/services/`):
   - Business logic separated into domain-specific services
   - Each service encapsulates functionality (mail_service, chat_service, etc.)
   - Error handling and business logic implementation

3. **Model Layer** (`app/models/`):
   - Pydantic models for request/response validation
   - Data schemas and type definitions

4. **Database Layer** (`app/db/`):
   - MongoDB for persistence
   - ChromaDB for vector embeddings
   - Redis for caching

### AI Agent Architecture

The core AI functionality uses LangChain with a graph-based approach:

1. `app/langchain/agent.py` - Core agent implementation
2. `app/langchain/graph_builder.py` - Builds the agent's decision graph
3. `app/langchain/graph_manager.py` - Manages the agent's state and graph
4. `app/langchain/tools/` - Specific capabilities (mail, calendar, search, etc.)

The application initializes with a lifespan context manager (`app/core/lifespan.py`) that sets up ChromaDB, NLTK resources, and the agent graph.

## Code Standards and Best Practices

### Route Handler Structure

Route handlers should be thin wrappers around service functions:

```python
@router.post("/resource", response_model=ResourceResponse)
async def create_resource_endpoint(
    resource: ResourceModel,
    user: dict = Depends(get_current_user)
):
    """Create a new resource."""
    return await create_resource(resource, user["user_id"])
```

### Service Function Structure

Service functions should contain the business logic:

```python
async def create_resource(resource: ResourceModel, user_id: str) -> ResourceResponse:
    """
    Create a new resource in the database.
    
    Args:
        resource: The resource data model
        user_id: The ID of the user creating the resource
        
    Returns:
        ResourceResponse: The created resource with additional metadata
        
    Raises:
        HTTPException: If resource creation fails
    """
    # Implementation logic here
    return resource_response
```

### Commit Message Format

Use conventional commits format:
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(auth): add OAuth2 token refresh endpoint`