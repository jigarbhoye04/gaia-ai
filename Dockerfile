FROM python:3.12-slim

# Install uv (Ultra-Fast Python Package Installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy the application into the container.
COPY . /app

# Install the application dependencies.
WORKDIR /app

# RUN uv sync --frozen --no-cache
RUN uv sync --frozen

RUN /app/.venv/bin/python -m nltk.downloader punkt stopwords punkt_tab

#  Expose the port
EXPOSE 80

# Run the application using Uvicorn
CMD ["/app/.venv/bin/python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]