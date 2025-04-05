# ---- Base Stage: Setup Python & Install Dependencies ----
FROM python:3.12-slim AS base

# Install uv (Ultra-Fast Python Package Installer)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Optimize Python performance
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Install system dependencies required for Playwright browsers and Tesseract
RUN apt update && apt install -y \
    libnss3 libatk1.0-0 libx11-xcb1 libxcb-dri3-0 \
    libdrm2 libxcomposite1 libxdamage1 libxrandr2 \
    libgbm1 libasound2 curl unzip tesseract-ocr && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency files first to leverage Docker caching
COPY pyproject.toml ./

# Install dependencies efficiently using UV with caching
# RUN --mount=type=cache,target=/root/.cache/uv \
RUN uv pip install --system -e .

# ---- Builder Stage: Download Additional Resources ----
FROM base AS builder

# Install the Playwright Python module and download browser binaries
# RUN uv pip install --system playwright && \
#     python -m playwright install --with-deps

# Download necessary NLTK data
RUN python -m nltk.downloader punkt stopwords punkt_tab

# ---- Playwright Stage: Official Browser Assets ----
FROM mcr.microsoft.com/playwright:v1.51.1-noble AS playwright
# This stage is used solely to source the official browser assets

# ---- Final Stage: Build Minimal Runtime Image ----
FROM base AS final

# Create a non-root user for improved security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser /app /root

# Copy application code
COPY . /app

# Copy downloaded NLTK data from the builder stage
COPY --from=builder /root/nltk_data /root/nltk_data

# Copy Playwright browser assets from the official image stage
COPY --from=playwright /ms-playwright /root/.cache/ms-playwright

# Expose application port
EXPOSE 80
EXPOSE 8000

# Switch to non-root user
USER appuser

# Start the FastAPI application
# CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
