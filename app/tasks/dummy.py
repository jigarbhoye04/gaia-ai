from celery import shared_task
import time


@shared_task(name="dummy.test_task")
def test_task(name="World"):
    """Simple test task that waits 2 seconds"""
    time.sleep(2)
    return f"Hello, {name}! Task completed."
