# Contributing to Gaia FastAPI Backend

Thank you for considering contributing to the Gaia project! This document provides guidelines and instructions for contributing to the codebase.

## 📝 Code Style & Best Practices

### General Guidelines

- Follow [PEP 8](https://peps.python.org/pep-0008/) for Python code style
- Use type hints for all function parameters and return values
- Include comprehensive docstrings for all modules, classes, and functions
- Run `uvx ruff check` before committing to ensure code quality

### Code Structure

#### Route Handler Best Practices

Route handlers should be thin wrappers around service functions:

```python
@router.post("/resource", response_model=ResourceResponse)
async def create_resource_endpoint(
    resource: ResourceModel,
    user: dict = Depends(get_current_user)
):
    """
    Create a new resource.

    Args:
        resource: The resource data
        user: The authenticated user information

    Returns:
        The created resource
    """
    return await create_resource(resource, user["user_id"])
```

#### Service Function Best Practices

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
    # ...

    return resource_response
```

## 🌿 Git Workflow

### Branch Management

1. **Feature Branches:** Create a new branch for each feature or bug fix

   ```sh
   git checkout -b feature/feature-name
   ```

2. **Pull Requests:** Submit changes via pull request to the `main` branch

   - Include descriptive title and detailed description
   - Reference any related issues

3. **Deployment:** Follow the production workflow in README.md to deploy changes

### Commit Messages

- Use the conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(auth): add OAuth2 token refresh endpoint`

## 🧪 Testing

- Write tests for all new features and bug fixes
- Ensure tests pass locally before submitting PR
- Both unit and integration tests are encouraged

## 📦 Dependencies

- Use `uv add package_name` to add new dependencies
<!-- - Update requirements.txt with `uv pip freeze > requirements.txt` -->

## 🚀 Pull Request Process

1. Update documentation if necessary
2. Add/update tests as appropriate
3. Ensure all tests pass locally
4. Submit PR with comprehensive description
5. Address any review comments

## ⚡ Route-to-Service Migration Guide

To move logic from routes to service files:

1. Create or update service files in the `/app/services` directory
2. Extract business logic from route handlers to service functions
3. Add proper type hints and docstrings to service functions
4. Update route handlers to call these service functions
5. Ensure error handling is properly implemented in service functions

### Example

**Before (route handler with logic):**

```python
@router.post("/items")
async def create_item(item: ItemModel, user: dict = Depends(get_current_user)):
    # Logic directly in route handler
    item_dict = item.dict()
    item_dict["user_id"] = user["user_id"]
    item_dict["created_at"] = datetime.now()

    try:
        result = await items_collection.insert_one(item_dict)
        return {"id": str(result.inserted_id), **item_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**After (clean route handler):**

```python
@router.post("/items", response_model=ItemResponse)
async def create_item_endpoint(item: ItemModel, user: dict = Depends(get_current_user)):
    """Create a new item."""
    return await create_item(item, user["user_id"])
```

**Service function (in items_service.py):**

```python
async def create_item(item: ItemModel, user_id: str) -> ItemResponse:
    """
    Create a new item in the database.

    Args:
        item: The item data model
        user_id: The ID of the user creating the item

    Returns:
        ItemResponse: The created item with additional metadata

    Raises:
        HTTPException: If item creation fails
    """
    item_dict = item.dict()
    item_dict["user_id"] = user_id
    item_dict["created_at"] = datetime.now()

    try:
        result = await items_collection.insert_one(item_dict)
        return ItemResponse(id=str(result.inserted_id), **item_dict)
    except Exception as e:
        logger.error(f"Failed to create item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create item")
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [MongoDB Motor Documentation](https://motor.readthedocs.io/)
