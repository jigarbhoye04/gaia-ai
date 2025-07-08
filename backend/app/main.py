"""
Main module for the GAIA FastAPI application.

This module initializes and runs the FastAPI application.
"""

from app.core.app_factory import create_app

# Create the FastAPI application
app = create_app()
