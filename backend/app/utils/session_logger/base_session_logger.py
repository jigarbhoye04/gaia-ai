"""
Base session logging utility for various processing workflows.

This module provides a generic session-based logging system that can be extended
for different modules with shared rotating log files, automatic cleanup, and size limits.
"""

import glob
import logging
import logging.handlers
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Type


class BaseProcessingSession(ABC):
    """
    Base class for processing sessions with structured logging.
    Uses shared rotating log files per module type with both time and size rotation.
    """

    # Class-level shared loggers for different modules
    _shared_loggers: Dict[str, logging.Logger] = {}
    _cleanup_done: Dict[str, bool] = {}

    def __init__(
        self,
        module_name: str,
        session_data: Dict[str, Any],
        session_id: Optional[str] = None,
    ):
        self.module_name = module_name
        self.session_id = session_id or str(uuid.uuid4())[:8]
        self.session_data = session_data
        self.start_time = datetime.now(timezone.utc)
        self.errors: list[Dict[str, Any]] = []
        self.milestones: list[Dict[str, Any]] = []

        # Get or create shared logger for this module
        self.logger = self._get_shared_logger()

        # Clean up old log files (only once per module per process startup)
        if not self._cleanup_done.get(module_name, False):
            self._cleanup_old_logs()
            self._cleanup_done[module_name] = True

        # Log session start
        self._log_session_start()

    @classmethod
    def _create_shared_logger(cls, module_name: str) -> logging.Logger:
        """Get or create the shared rotating logger for a specific module."""
        if module_name in cls._shared_loggers:
            return cls._shared_loggers[module_name]

        logger_name = f"{module_name}_sessions"
        logger = logging.getLogger(logger_name)

        # Avoid duplicate handlers
        if logger.handlers:
            cls._shared_loggers[module_name] = logger
            return logger

        logger.setLevel(logging.DEBUG)

        # Create logs directory if it doesn't exist
        log_dir = Path("logs") / f"{module_name}_sessions"
        log_dir.mkdir(parents=True, exist_ok=True)

        # Use RotatingFileHandler for size-based rotation with time cleanup
        log_file = log_dir / f"{module_name}_processing.log"

        # Rotate when file reaches 10MB, keep 5 files, plus time-based cleanup
        file_handler = logging.handlers.RotatingFileHandler(
            filename=str(log_file),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,  # Keep 5 backup files
            encoding="utf-8",
        )
        file_handler.setLevel(logging.DEBUG)

        # Detailed formatter for session logs
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | [SESSION:%(session_id)s] | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        file_handler.setFormatter(formatter)

        logger.addHandler(file_handler)
        logger.propagate = False  # Don't propagate to root logger

        cls._shared_loggers[module_name] = logger
        return logger

    def _get_shared_logger(self) -> logging.Logger:
        """Get the shared logger for this session's module."""
        return self.__class__._create_shared_logger(self.module_name)

    def _cleanup_old_logs(self):
        """Clean up log files older than 15 days for this module."""
        try:
            log_dir = Path("logs") / f"{self.module_name}_sessions"
            if not log_dir.exists():
                return

            # Find all log files for this module (including rotated ones)
            log_patterns = [
                str(log_dir / f"{self.module_name}_processing.log*"),
                str(log_dir / f"{self.module_name}_processing.log.*"),
            ]

            log_files = []
            for pattern in log_patterns:
                log_files.extend(glob.glob(pattern))

            cutoff_date = datetime.now() - timedelta(days=15)
            deleted_count = 0

            for log_file in log_files:
                try:
                    file_path = Path(log_file)
                    # Skip the current active log file
                    if file_path.name == f"{self.module_name}_processing.log":
                        continue

                    # Get file modification time
                    file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)

                    if file_mtime < cutoff_date:
                        file_path.unlink()
                        deleted_count += 1
                except Exception as e:
                    # Log to console if we can't clean up specific files
                    print(f"Warning: Could not delete old log file {log_file}: {e}")

            if deleted_count > 0:
                self._log_with_session(
                    "INFO", f"Cleaned up {deleted_count} old log files"
                )

        except Exception as e:
            print(f"Warning: Could not perform log cleanup: {e}")

    def _log_with_session(
        self, level: str, message: str, extra_data: Optional[Dict[str, Any]] = None
    ):
        """Log a message with session context."""
        # Create extra data for the formatter
        extra = {"session_id": self.session_id}

        # Add any additional context
        if extra_data:
            formatted_extra = ", ".join([f"{k}={v}" for k, v in extra_data.items()])
            message = f"{message} | {formatted_extra}"

        # Log at the appropriate level
        log_method = getattr(self.logger, level.lower())
        log_method(message, extra=extra)

    @abstractmethod
    def _log_session_start(self):
        """Log the start of the processing session. Must be implemented by subclasses."""
        pass

    @abstractmethod
    def get_session_summary_data(self) -> Dict[str, Any]:
        """Get session-specific summary data. Must be implemented by subclasses."""
        pass

    def log_milestone(self, milestone: str, details: Optional[Dict[str, Any]] = None):
        """Log a major milestone in the processing workflow."""
        milestone_data = {
            "milestone": milestone,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details or {},
        }
        self.milestones.append(milestone_data)

        self._log_with_session("INFO", f"MILESTONE: {milestone}", details)

    def log_error(
        self,
        error_type: str,
        error_message: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Log an error with context."""
        error_data = {
            "error_type": error_type,
            "error_message": error_message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "details": details or {},
        }
        self.errors.append(error_data)

        self._log_with_session(
            "ERROR", f"ERROR: {error_type} - {error_message}", details
        )

    def log_session_summary(self, final_result: Dict[str, Any]):
        """Log the final session summary."""
        end_time = datetime.now(timezone.utc)
        duration = (end_time - self.start_time).total_seconds()

        self._log_with_session("INFO", "-" * 80)
        self._log_with_session("INFO", "SESSION SUMMARY")
        self._log_with_session("INFO", "-" * 80)
        self._log_with_session("INFO", f"Session ID: {self.session_id}")
        self._log_with_session("INFO", f"Module: {self.module_name}")
        self._log_with_session("INFO", f"Duration: {duration:.2f} seconds")
        self._log_with_session("INFO", f"Milestones: {len(self.milestones)}")
        self._log_with_session("INFO", f"Errors: {len(self.errors)}")
        self._log_with_session(
            "INFO", f"Final Status: {final_result.get('status', 'unknown')}"
        )

        # Log module-specific summary data
        module_summary = self.get_session_summary_data()
        for key, value in module_summary.items():
            self._log_with_session("INFO", f"{key}: {value}")

        # Log milestone summary
        if self.milestones:
            self._log_with_session("INFO", "MILESTONES:")
            for milestone in self.milestones:
                self._log_with_session("INFO", f"  ✓ {milestone['milestone']}")

        # Log error summary
        if self.errors:
            self._log_with_session("INFO", "ERRORS:")
            for error in self.errors:
                self._log_with_session(
                    "INFO", f"  ✗ {error['error_type']}: {error['error_message']}"
                )

        self._log_with_session("INFO", "=" * 80)
        self._log_with_session(
            "INFO", f"{self.module_name.upper()} PROCESSING SESSION COMPLETED"
        )
        self._log_with_session("INFO", "=" * 80)

    def get_session_data(self) -> Dict[str, Any]:
        """Get session data for external logging or monitoring."""
        return {
            "session_id": self.session_id,
            "module_name": self.module_name,
            "session_data": self.session_data,
            "start_time": self.start_time.isoformat(),
            "milestones": self.milestones,
            "errors": self.errors,
        }


class BaseSessionManager:
    """
    Base class for managing processing sessions.
    """

    def __init__(self, session_class: Type[BaseProcessingSession]):
        self.session_class = session_class
        self._active_sessions: Dict[str, BaseProcessingSession] = {}

    def create_session(self, *args, **kwargs) -> BaseProcessingSession:
        """Create a new processing session."""
        session = self.session_class(*args, **kwargs)
        self._active_sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[BaseProcessingSession]:
        """Get an active session by ID."""
        return self._active_sessions.get(session_id)

    def end_session(self, session_id: str):
        """End and cleanup a session."""
        self._active_sessions.pop(session_id, None)

    def get_active_sessions_count(self) -> int:
        """Get the number of active sessions."""
        return len(self._active_sessions)

    def get_all_active_sessions(self) -> Dict[str, BaseProcessingSession]:
        """Get all active sessions."""
        return self._active_sessions.copy()
