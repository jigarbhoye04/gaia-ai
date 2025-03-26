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
    libgbm1 libasound2 curl unzip tesseract-ocr && rm -rf /var/lib/apt/lists/*

# Copy dependency files first to leverage Docker caching
COPY pyproject.toml ./

# Install dependencies efficiently using UV with caching
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system -e .

# ---- Builder Stage: Download Additional Resources ----
FROM base AS builder

# Install Playwright and download browsers
RUN uv pip install --system playwright && playwright install --with-deps

# Download necessary NLTK data
RUN python -m nltk.downloader punkt stopwords punkt_tab

# ---- Final Stage: Build Minimal Runtime Image ----
FROM base AS final

# Copy application code
COPY . /app

# Copy downloaded NLTK data from builder stage
COPY --from=builder /root/nltk_data /root/nltk_data

# Copy Playwright browsers from builder stage
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Expose application port
EXPOSE 80

# Start the FastAPI application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
