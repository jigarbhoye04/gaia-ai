# External Docstrings Pattern

This pattern allows for centralized management of function docstrings, making it easier to maintain, update, and reuse documentation across the codebase.

## Implementation

### 1. Core Components

- **`app/docstrings/utils.py`**: Contains the `with_doc` decorator
- **`app/docstrings/langchain/tools/*.py`**: Contains the actual docstrings as constants
- **Application code**: Uses the `with_doc` decorator to apply docstrings

### 2. Structure

```
app/
  └── docstrings/
      ├── __init__.py
      ├── utils.py  # Contains with_doc decorator
      └── langchain/
          ├── __init__.py
          └── tools/
              ├── __init__.py
              ├── mail_tool_docs.py  # Contains mail tool docstrings
              ├── calendar_tool_docs.py
              └── ... (other tool docstrings)
```

### 3. Usage

```python
# In your application code:
from app.docstrings.langchain.tools.mail_tool_docs import LIST_GMAIL_LABELS_DOC
from app.docstrings.utils import with_doc

@tool  # The langchain tool decorator
@with_doc(LIST_GMAIL_LABELS_DOC)  # Apply the external docstring
async def list_gmail_labels(config: RunnableConfig) -> Dict[str, Any]:
    """Original docstring required for @tool decorator, but will be replaced"""
    # Function implementation
```

## Benefits

1. **Centralized Documentation**: All docstrings are managed in one place
2. **Consistency**: Ensures consistent documentation style across tools
3. **Maintainability**: Easier to update documentation without modifying code
4. **Reusability**: Docstrings can be reused in multiple contexts

## Decorator Implementation

The `with_doc` decorator is a simple function that replaces a function's docstring:

```python
def with_doc(docstring):
    def decorator(func):
        func.__doc__ = docstring
        return func
    return decorator
```

This pattern retains the original `@tool` decorator functionality while providing a cleaner way to manage docstrings.
