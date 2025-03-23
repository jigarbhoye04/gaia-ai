import cProfile
import io
import pstats
import threading
from contextlib import contextmanager
from functools import wraps

from celery.utils.log import get_task_logger

from app.config.loggers import profiler_logger as logger

celery_logger = get_task_logger(__name__)

_local = threading.local()


@contextmanager
def profile_block(name="Code Block", sort_by="cumulative", print_lines=5):
    """A thread-safe contextmanager for profiling code blocks.

    Args:
        name: Identifier for this profiling block
        sort_by: Stats sorting method
        print_lines: Number of lines to print in the stats
    """
    # Check if profiling is already happening on this thread
    if getattr(_local, "is_profiling", False):
        logger.debug(f"Nested profiling detected for {name}, skipping")
        try:
            yield
        finally:
            pass
        return

    # Set profiling flag for this thread
    _local.is_profiling = True
    profiler = cProfile.Profile()

    try:
        profiler.enable()
        yield
    finally:
        profiler.disable()
        s = io.StringIO()
        stats = pstats.Stats(profiler, stream=s).sort_stats(sort_by)
        stats.print_stats(print_lines)
        logger.info(f"Profiling Results for {name}:\n{s.getvalue()}")
        # Clear the flag
        _local.is_profiling = False


def profile_celery_task(print_lines=7):
    """Decorator to profile Celery tasks with configurable print stats."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            profiler = cProfile.Profile()
            profiler.enable()

            try:
                result = func(*args, **kwargs)
            finally:
                profiler.disable()

                # Collect profiling stats
                s = io.StringIO()
                ps = pstats.Stats(profiler, stream=s).sort_stats(
                    pstats.SortKey.CUMULATIVE
                )
                ps.print_stats(print_lines)

                # Log the profiling output
                profiling_output = s.getvalue()
                celery_logger.info(
                    f"Profiling results for {func.__name__}:\n{profiling_output}"
                )

            return result

        return wrapper

    return decorator
