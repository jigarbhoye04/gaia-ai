# ---- Base Stage: Setup Python & Install Dependencies ----
FROM python:3.12-slim AS base

ARG ENV=production
ENV ENV=${ENV} \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install uv (Ultra-Fast Python Package Installer) and system dependencies in one go
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libnss3 libatk1.0-0 libx11-xcb1 libxcb-dri3-0 \
      libdrm2 libxcomposite1 libxdamage1 libxrandr2 \
      libgbm1 libasound2 curl unzip tesseract-ocr && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files and install Python dependencies using caching
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    if [ "$ENV" = "production" ]; then \
      uv pip install --system --no-cache-dir . ; \
    else \
      uv pip install --system --no-cache-dir -e . ; \
    fi

# ---- Builder Stage: Download Additional Resources ----
FROM base AS builder
RUN python -m nltk.downloader -d /root/nltk_data punkt stopwords punkt_tab

# ---- Playwright Stage: Official Browser Assets ----
FROM mcr.microsoft.com/playwright:v1.51.1-noble AS playwright
# This stage is used solely to source the official browser assets

# ---- Final Stage: Build Minimal Runtime Image ----
FROM base AS final

# Create a non-root user and switch ownership in one layer
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser /app

# Copy application code and resources
COPY --chown=appuser:appuser . /app
COPY --from=builder /root/nltk_data /home/appuser/nltk_data
COPY --from=playwright /ms-playwright /root/.cache/ms-playwright

# Expose application ports
EXPOSE 80
EXPOSE 8000

# Switch to non-root user
USER appuser

# Start the FastAPI application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
