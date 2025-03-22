FROM python:3.12-slim

# Install uv (Ultra-Fast Python Package Installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Enable bytecode compilation and copy from cache
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy only dependency files first to leverage Docker caching
COPY pyproject.toml ./

# Install dependencies efficiently using UV with caching
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e .

# Copy the rest of the application code
COPY . /app

# Install NLTK data
RUN python -m nltk.downloader punkt stopwords punkt_tab

# Expose the port
EXPOSE 80

# Run the application using Uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]