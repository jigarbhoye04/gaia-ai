/**
 * Calendar-specific date formatting utilities for proper event display
 */

/**
 * Format date for all-day events - shows only the date without time
 */
export const formatAllDayDate = (dateString: string): string => {
  try {
    // Handle both date-only (YYYY-MM-DD) and datetime strings
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }).format(date);
  } catch (error) {
    console.error("Error formatting all-day date:", error);
    return dateString; // fallback to original string
  }
};

/**
 * Format datetime for timed events - shows date and time
 */
export const formatTimedEventDate = (isoString: string): string => {
  try {
    // Remove timezone offset to prevent shifting
    const withoutTimezone = isoString.replace(/([+-]\d{2}:\d{2})$/, "");
    const date = new Date(withoutTimezone);

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting timed event date:", error);
    return isoString; // fallback to original string
  }
};

/**
 * Format date range for all-day events spanning multiple days
 */
export const formatAllDayDateRange = (
  startDate: string,
  endDate: string,
): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if it's the same day
    if (start.toDateString() === end.toDateString()) {
      return formatAllDayDate(startDate);
    }

    // Different days - show range
    const startFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(start);

    const endFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(end);

    return `${startFormatted} - ${endFormatted}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    return `${startDate} - ${endDate}`; // fallback
  }
};

/**
 * Check if a date string represents a date-only value (no time component)
 */
export const isDateOnly = (dateString: string): boolean => {
  // Check if string matches YYYY-MM-DD format (date only)
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

/**
 * Get user-friendly event duration text
 */
export const getEventDurationText = (
  startDate: string,
  endDate?: string,
): string => {
  if (!endDate) {
    return "Single event";
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    } else if (diffHours < 24) {
      const hours = Math.round(diffHours);
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(diffHours / 24);
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  } catch (error) {
    return "Duration unknown";
  }
};
