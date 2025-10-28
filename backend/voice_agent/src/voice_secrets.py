"""
Infisical secrets management for Gaia voice microservice.

This version is standalone — does not depend on `app.config.loggers` or backend imports.
Loads secrets from Infisical and injects them into `os.environ`.
Local .env values always take precedence.
"""
import os
from dotenv import load_dotenv
from infisical_sdk import InfisicalSDKClient

def _log(msg: str, level: str = "INFO"):
    print(f"[{level}] {msg}")

class InfisicalConfigError(Exception):
    pass

load_dotenv()

def inject_infisical_secrets():
    # prevent multiple calls across forked processes
    if os.environ.get("_INFISICAL_ALREADY_INJECTED") == "1":
        return

    INFISICAL_PROJECT_ID = os.getenv("INFISICAL_PROJECT_ID")
    CLIENT_ID = os.getenv("INFISICAL_MACHINE_INDENTITY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("INFISICAL_MACHINE_INDENTITY_CLIENT_SECRET")
    ENV = os.getenv("ENV", "production")

    if not all([INFISICAL_PROJECT_ID, CLIENT_ID, CLIENT_SECRET]):
        _log("Skipping Infisical — missing credentials.", "WARN")
        return

    try:
        _log("Connecting to Infisical...")

        client = InfisicalSDKClient(
            host="https://app.infisical.com",
            cache_ttl=3600,
        )
        client.auth.universal_auth.login(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
        )

        secrets = client.secrets.list_secrets(
            project_id=INFISICAL_PROJECT_ID,
            environment_slug=ENV,
            secret_path="/",
            expand_secret_references=True,
            view_secret_value=True,
            recursive=False,
            include_imports=True,
        )

        for s in secrets.secrets:
            os.environ.setdefault(s.secretKey, s.secretValue)

        os.environ["_INFISICAL_ALREADY_INJECTED"] = "1"
        _log("Infisical secrets injection complete")

    except Exception as e:
        raise InfisicalConfigError(f"Failed to fetch Infisical secrets: {e}") from e
