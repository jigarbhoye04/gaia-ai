import cProfile
import pstats
import io

from app.config.loggers import profiler_logger as logger


def profile_function(func, sort_by="cumulative"):
    """
    Profiles a function and logs the results.

    :param func: Function to profile
    :param sort_by: Sorting criteria (default: "cumulative")
    :return: Wrapped function with profiling
    """

    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        result = func(*args, **kwargs)
        profiler.disable()

        s = io.StringIO()
        stats = pstats.Stats(profiler, stream=s).sort_stats(sort_by)
        stats.print_stats(20)  # Show top 20 slowest calls

        logger.info(f"Profiling Results for {func.__name__}:\n{s.getvalue()}")

        return result

    return wrapper


class Profiler:
    """Class-based context manager for profiling code blocks."""

    def __init__(self, name="Code Block", sort_by="cumulative"):
        self.name = name
        self.sort_by = sort_by
        self.profiler = cProfile.Profile()

    def __enter__(self):
        self.profiler.enable()

    def __exit__(self, exc_type, exc_value, traceback):
        self.profiler.disable()
        s = io.StringIO()
        stats = pstats.Stats(self.profiler, stream=s).sort_stats(self.sort_by)
        stats.print_stats(20)
        logger.info(f"Profiling Results for {self.name}:\n{s.getvalue()}")
