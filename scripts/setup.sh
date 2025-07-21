#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Docker Compose ---
echo "Starting Docker services in the background..."
docker-compose up -d

# --- Backend Setup ---
echo "Setting up backend..."
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

echo "Activating virtual environment..."
source .venv/bin/activate

echo "Installing backend dependencies with uv..."
cd ../backend
uv sync

# --- Frontend Setup ---
echo "Setting up frontend..."
cd ../frontend

echo "Installing frontend dependencies with pnpm..."
pnpm install

cd ..

echo "Setup complete!"
