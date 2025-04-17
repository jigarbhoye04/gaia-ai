FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      libnss3 libatk1.0-0 libx11-xcb1 libxcb-dri3-0 \
      libdrm2 libxcomposite1 libxdamage1 libxrandr2 \
      libgbm1 libasound2 curl unzip tesseract-ocr \
      libdbus-1-3 && \
    rm -rf /var/lib/apt/lists/*

# Install only heavy optional dependencies
COPY pyproject.toml ./
  RUN uv pip install --system --no-cache-dir --group heavy  && rm -rf /root/.cache

# Playwright and NLTK setup
RUN python -m playwright install --with-deps chromium
RUN python -m nltk.downloader punkt stopwords punkt_tab && \
    rm -rf /root/.cache

# Build:
# docker build -t aryanranderiya/gaia-base:latest -f first-stage.Dockerfile .

# Tag and Push:
# docker push aryanranderiya/gaia-base:latest

# Tag and push this image in one shot:
# docker build -t aryanranderiya/gaia-base:latest -f first-stage.Dockerfile . && docker push aryanranderiya/gaia-base:latest
