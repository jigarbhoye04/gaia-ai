# Use an official Python image as the base
FROM python:3.12
# FROM ubuntu:22.04

# Set the working directory inside the container
WORKDIR /app

# Install dependencies for C development and Rust
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    gcc \
    g++ \
    make \
    libc-dev \
    libffi-dev \
    curl \
    libpq-dev \
    libssl-dev \
    libudev-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Upgrade pip to the latest version
RUN pip install --upgrade pip

# Install dependencies
RUN pip install -r requirements.txt
RUN pip install python-multipart

RUN pip freeze > requirements_installed.txt

# Copy the rest of the application code into the container
# The . (source) refers to your local directory.
# The second . (destination) refers to the container's working directory /app.
COPY . .

# Expose the application port
EXPOSE 8000

# Command to run the FastAPI app with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Build the Docker container, DOT . is the current directory
# docker build -t gaia .

# Run the Docker Container from the image, -p : specify port
# docker run -p 8000:8000 gaia