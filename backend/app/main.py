"""
Main module for the GAIA FastAPI application.

This module initializes and runs the FastAPI application.
"""

from app.core.app_factory import create_app
from app.config.sentry import init_sentry

# Create the FastAPI application
app = create_app()
init_sentry()


@app.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0
    return True
