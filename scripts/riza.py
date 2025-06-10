# Script to create custom runtimes using the Riza API

import time
import json
import os
from typing import Dict, Literal, Any
from rizaio import Riza

API_KEY = os.getenv("RIZA_API_KEY")
riza = Riza(api_key=API_KEY)


def create_runtime(name, language, manifest_path):
    # Read manifest file
    with open(manifest_path, "r") as f:
        manifest_contents = f.read()

    # Create runtime
    runtime = riza.runtimes.create(
        name=name,
        language=language,
        manifest_file={"name": manifest_path, "contents": manifest_contents},
    )
    print(f"Created runtime: {runtime.id}")
    return runtime.id


def check_runtime_status(runtime_id: str) -> Dict[str, Any]:
    """Check the current status of a runtime."""
    try:
        runtime = riza.runtimes.get(id=runtime_id)
        return {
            "id": runtime.id,
            "status": runtime.status,
            "revision_id": getattr(runtime, "revision_id", None),
            "name": getattr(runtime, "name", None),
        }
    except Exception as e:
        print(f"Error checking runtime status: {e}")
        return {}


def poll_runtime_status(
    runtime_id: str, polling_interval: int = 5, timeout: int = 300
) -> str:
    """Poll runtime status until build completes or timeout."""
    start_time = time.time()
    print("Building runtime", end="", flush=True)

    while True:
        elapsed = time.time() - start_time
        if elapsed > timeout:
            print("\n❌ Build timeout exceeded")
            return "timeout"

        runtime = riza.runtimes.get(id=runtime_id)
        status = runtime.status

        if status in ["succeeded", "failed"]:
            print(f"\n{'✅' if status == 'succeeded' else '❌'} Build {status}")
            return status

        print(".", end="", flush=True)
        time.sleep(polling_interval)


def check_runtime_revisions(runtime_id: str):
    """Check all revisions for a runtime and their statuses."""
    try:
        revisions = riza.runtimes.revisions.list(runtime_id=runtime_id)
        print(f"\nRevisions for runtime {runtime_id}:")
        for revision in revisions:
            print(f"  Revision {revision.id}: {revision.status}")
        return revisions
    except Exception as e:
        print(f"Error checking revisions: {e}")
        return []


def validate_manifest(language: str, manifest_contents: str) -> Dict[str, list]:
    """Validate manifest file contents before creating runtime."""
    errors = []
    warnings = []

    if language == "python":
        lines = manifest_contents.strip().split("\n")
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Check for common issues
            if " " in line and "==" not in line and ">" not in line and "<" not in line:
                errors.append(
                    f"Line {i}: Invalid format '{line}' - use package==version"
                )

            # Check for package name validity
            if "==" in line:
                package = line.split("==")[0]
                if not package.replace("-", "").replace("_", "").isalnum():
                    warnings.append(f"Line {i}: Unusual package name '{package}'")

    elif language == "javascript":
        try:
            data = json.loads(manifest_contents)
            if "dependencies" not in data and "devDependencies" not in data:
                errors.append("No dependencies found in package.json")
        except json.JSONDecodeError as e:
            errors.append(f"Invalid JSON in package.json: {e}")

    return {"errors": errors, "warnings": warnings}


def create_test_runtime(language: Literal["python", "javascript"] = "python"):
    """Create a simple test runtime with one well-known package."""
    test_configs = {
        "python": {
            "name": "test_python_runtime",
            "manifest": {"name": "requirements.txt", "contents": "requests==2.31.0"},
        },
        "javascript": {
            "name": "test_js_runtime",
            "manifest": {
                "name": "package.json",
                "contents": '{"dependencies": {"marked": "^15.0.6"}}',
            },
        },
    }

    config = test_configs[language]
    print(f"Creating test {language} runtime...")

    runtime = riza.runtimes.create(
        name=config["name"],
        language=language,
        manifest_file=config["manifest"],
    )

    print(f"Created test runtime: {runtime.id}")
    return runtime.id


def troubleshoot_runtime(runtime_id: str):
    """Comprehensive troubleshooting for a runtime build."""
    print(f"\n🔍 Troubleshooting runtime: {runtime_id}\n")

    # Step 1: Check current status
    print("1. Checking runtime status...")
    status_info = check_runtime_status(runtime_id)
    if status_info:
        print(f"   Status: {status_info['status']}")
        print(f"   Name: {status_info['name']}")
        if status_info["revision_id"]:
            print(f"   Revision ID: {status_info['revision_id']}")
    else:
        print("   ❌ Failed to get runtime status")
        return

    # Step 2: Check revisions
    print("\n2. Checking runtime revisions...")
    check_runtime_revisions(runtime_id)


def main():
    import sys

    # Check for command-line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "troubleshoot" and len(sys.argv) > 2:
            runtime_id = sys.argv[2]
            troubleshoot_runtime(runtime_id)
            return

        elif command == "status" and len(sys.argv) > 2:
            runtime_id = sys.argv[2]
            status = check_runtime_status(runtime_id)
            if status:
                print(f"Runtime {runtime_id}: {status['status']}")
            return

        elif command == "test":
            language = sys.argv[2] if len(sys.argv) > 2 else "python"
            if language not in ["python", "javascript"]:
                print("Language must be 'python' or 'javascript'")
                return
            runtime_id = create_test_runtime(language)
            status = poll_runtime_status(runtime_id)
            if status == "failed":
                troubleshoot_runtime(runtime_id)
            return

        elif command == "help":
            print("\nUsage:")
            print("  python riza.py                  # Create runtime from config")
            print("  python riza.py troubleshoot <id> # Troubleshoot a runtime")
            print("  python riza.py status <id>       # Check runtime status")
            print("  python riza.py test [python|js]  # Create test runtime")
            print("  python riza.py help              # Show this help")
            return

    # Default behavior: create runtime from config
    config = {
        "name": "my_custom_runtime",
        "language": "python",  # or "javascript"
        "manifest_file": "riza-requirements.txt",  # or "package.json"
    }

    # Read and validate manifest
    try:
        with open(config["manifest_file"], "r") as f:
            manifest_contents = f.read()
    except FileNotFoundError:
        print(f"❌ Manifest file not found: {config['manifest_file']}")
        return

    # Validate manifest before creating runtime
    validation = validate_manifest(config["language"], manifest_contents)
    if validation["errors"]:
        print("❌ Manifest validation errors:")
        for error in validation["errors"]:
            print(f"   - {error}")
        return

    if validation["warnings"]:
        print("⚠️  Manifest warnings:")
        for warning in validation["warnings"]:
            print(f"   - {warning}")
        print()

    # Create runtime
    runtime_id = create_runtime(
        name=config["name"],
        language=config["language"],
        manifest_path=config["manifest_file"],
    )

    # Wait for build completion
    status = poll_runtime_status(runtime_id)

    if status == "succeeded":
        runtime = riza.runtimes.get(id=runtime_id)
        print(f"\n✅ Runtime ready! Use revision ID: {runtime.revision_id}")
        print("\nExample usage:")
        print(f'  runtime_id = "{runtime_id}"')
        print(f'  revision_id = "{runtime.revision_id}"')
    else:
        print("\n❌ Build failed")
        troubleshoot_runtime(runtime_id)


if __name__ == "__main__":
    main()
