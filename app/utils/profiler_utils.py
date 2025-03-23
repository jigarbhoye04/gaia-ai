import cProfile
import pstats
import io
import threading
from contextlib import contextmanager
from app.config.loggers import profiler_logger as logger

# Thread-local storage to track profiler state
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
