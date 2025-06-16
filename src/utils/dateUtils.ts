import { isValid,parseISO } from "date-fns";

/**
 * Formats a date string into a human-readable date format
 * Examples: "June 10, 2025", "March 15, 2024", "December 1, 2023"
 *
 * @param dateString - Date string in ISO format (YYYY-MM-DD) or any valid date format
 * @returns Human-readable date string
 */
export function formatRelativeDate(dateString: string): string {
  try {
    // Try to parse the date string
    let date: Date;

    // If it's in YYYY-MM-DD format, parse it as ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      date = parseISO(dateString);
    } else {
      // Try parsing as a regular date string
      date = new Date(dateString);
    }

    // Check if the date is valid
    if (!isValid(date)) {
      console.warn(`Invalid date string: ${dateString}`);
      return dateString; // Return original string if parsing fails
    }

    // Format as readable date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.warn(`Error formatting date: ${dateString}`, error);
    return dateString; // Return original string if error occurs
  }
}

/**
 * Formats a date string with fallback to relative time
 * If the date is recent (within 30 days), shows relative time
 * Otherwise, shows the formatted date
 *
 * @param dateString - Date string to format
 * @param showRelativeAlways - Always show relative time regardless of age
 * @returns Formatted date string
 */
export function formatDateWithFallback(
  dateString: string,
  showRelativeAlways: boolean = true,
): string {
  if (showRelativeAlways) {
    return formatRelativeDate(dateString);
  }

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Show relative time for dates within 30 days
    if (diffInDays <= 30) {
      return formatRelativeDate(dateString);
    }

    // Show formatted date for older dates
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return formatRelativeDate(dateString);
  }
}
