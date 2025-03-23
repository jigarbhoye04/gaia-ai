# ---- Base Stage: Setup Python & Install Dependencies ----
FROM python:3.12-slim AS base

# Install uv (Ultra-Fast Python Package Installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Optimize Python performance
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Copy dependency files first to leverage Docker caching
COPY pyproject.toml ./

# Install dependencies efficiently using UV with caching
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e .

# ---- Builder Stage: Download Additional Resources ----
FROM base AS builder

# Download necessary NLTK data
RUN python -m nltk.downloader punkt stopwords punkt_tab

# ---- Final Stage: Build Minimal Runtime Image ----
FROM base AS final

# Copy application code
COPY . /app

# Copy downloaded NLTK data from builder stage
COPY --from=builder /root/nltk_data /root/nltk_data

# Expose application port
EXPOSE 80

# Start the FastAPI application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
