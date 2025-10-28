"""
Infisical secrets management for Gaia voice microservice.

Standalone: does not depend on app.* packages. Injects secrets into os.environ.
Local .env values take precedence.
"""
import os
from dotenv import load_dotenv

# lightweight import of Infisical SDK (make sure this is in pyproject)
try:
    from infisical_sdk import InfisicalSDKClient
except Exception as e:
    InfisicalSDKClient = None  # we will fail gracefully if not installed

def _log(msg: str, level: str = "INFO"):
    print(f"[{level}] {msg}")

class InfisicalConfigError(Exception):
    pass

# load any .env already present (voice_settings.py does this too but harmless to call)
load_dotenv()

def inject_infisical_secrets():
    # prevent multiple injections across imports/forks
    if os.environ.get("_INFISICAL_ALREADY_INJECTED") == "1":
        return

    # required credentials (project-level machine identity)
    INFISICAL_PROJECT_ID = os.getenv("INFISICAL_PROJECT_ID")
    CLIENT_ID = os.getenv("INFISICAL_MACHINE_INDENTITY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("INFISICAL_MACHINE_INDENTITY_CLIENT_SECRET")
    ENV = os.getenv("ENV", "production")

    if not all([INFISICAL_PROJECT_ID, CLIENT_ID, CLIENT_SECRET]):
        _log("Skipping Infisical — missing credentials.", "WARN")
        return

    if InfisicalSDKClient is None:
        _log("Infisical SDK not installed; skipping Infisical injection", "WARN")
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

        injected = 0
        for s in secrets.secrets:
            # do not override local env (.env or docker env) — set only if missing
            if os.environ.get(s.secretKey) is None:
                os.environ[s.secretKey] = s.secretValue
                injected += 1

        os.environ["_INFISICAL_ALREADY_INJECTED"] = "1"
        _log(f"Infisical secrets injection complete (injected={injected})")

    except Exception as e:
        raise InfisicalConfigError(f"Failed to fetch Infisical secrets: {e}") from e
