import { Button } from "@heroui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { PencilEdit02Icon, Tick02Icon } from "@/components/shared/icons";
import { calendarApi } from "@/features/calendar/api/calendarApi";
import { MotionContainer } from "@/layouts/MotionContainer";
import {
  CalendarEditOptions,
  CalendarEventDateTime,
} from "@/types/features/convoTypes";
import {
  formatAllDayDate,
  formatAllDayDateRange,
  formatTimedEventDate,
  getEventDurationText,
  isDateOnly,
} from "@/utils/date/calendarDateUtils";

interface CalendarEditCardProps {
  editOption: CalendarEditOptions;
}

export function CalendarEditCard({ editOption }: CalendarEditCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "updated">("idle");

  const handleUpdateEvent = useCallback(async () => {
    try {
      setStatus("loading");

      const updatePayload: {
        event_id: string;
        calendar_id: string;
        original_summary: string;
        summary?: string;
        description?: string;
        start?: string;
        end?: string;
        is_all_day?: boolean;
        timezone?: string;
      } = {
        event_id: editOption.event_id,
        calendar_id: editOption.calendar_id,
        original_summary: editOption.original_summary,
      };

      // Only include fields that are being updated
      if (editOption.summary !== undefined) {
        updatePayload.summary = editOption.summary;
      }
      if (editOption.description !== undefined) {
        updatePayload.description = editOption.description;
      }
      if (editOption.start !== undefined) {
        updatePayload.start = editOption.start;
      }
      if (editOption.end !== undefined) {
        updatePayload.end = editOption.end;
      }
      if (editOption.is_all_day !== undefined) {
        updatePayload.is_all_day = editOption.is_all_day;
      }
      if (editOption.timezone !== undefined) {
        updatePayload.timezone = editOption.timezone;
      }

      await calendarApi.updateEventByAgent(updatePayload);

      setStatus("updated");
    } catch (error) {
      console.error("Error updating event:", error);
      setStatus("idle");
      toast.error("Failed to update event");
    }
  }, [editOption]);

  const formatDate = (
    start: CalendarEventDateTime | undefined,
    end: CalendarEventDateTime | undefined,
  ) => {
    if (!start) return "No date specified";

    try {
      if (start.date) {
        // All-day event
        if (end?.date && start.date !== end.date) {
          return formatAllDayDateRange(start.date, end.date);
        }
        return formatAllDayDate(start.date);
      } else if (start.dateTime) {
        // Timed event
        const startTime = start.dateTime;
        const endTime = end?.dateTime;

        if (isDateOnly(startTime)) {
          return formatAllDayDate(startTime);
        }

        const formattedDate = formatTimedEventDate(startTime);
        if (endTime) {
          const duration = getEventDurationText(startTime, endTime);
          return `${formattedDate} (${duration})`;
        }
        return formattedDate;
      }

      return "No date specified";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Helper to format simple date/time string
  const formatSimpleDateTime = (dateTimeStr: string) => {
    try {
      if (isDateOnly(dateTimeStr)) {
        return formatAllDayDate(dateTimeStr);
      }
      return formatTimedEventDate(dateTimeStr);
    } catch {
      return dateTimeStr;
    }
  };

  const hasChanges =
    editOption.summary !== undefined ||
    editOption.description !== undefined ||
    editOption.start !== undefined ||
    editOption.end !== undefined ||
    editOption.is_all_day !== undefined;

  return (
    <MotionContainer>
      <div className="w-full max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm dark:border-blue-800 dark:bg-blue-950/20">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start space-x-2">
            <PencilEdit02Icon className="mt-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Update Event
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Found event matching: "{editOption.original_query}"
              </p>
            </div>
          </div>

          {/* Original Event Details */}
          <div className="space-y-2 rounded border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="space-y-1">
              <h5 className="text-xs font-medium tracking-wide text-blue-700 uppercase dark:text-blue-300">
                Original Event
              </h5>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                {editOption.original_summary}
              </h3>

              {editOption.original_description && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {editOption.original_description}
                </p>
              )}

              <p className="text-sm text-blue-600 dark:text-blue-400">
                {formatDate(editOption.original_start, editOption.original_end)}
              </p>
            </div>

            {/* Changes */}
            {hasChanges && (
              <div className="mt-3 border-t border-blue-200 pt-2 dark:border-blue-800">
                <h5 className="text-xs font-medium tracking-wide text-blue-700 uppercase dark:text-blue-300">
                  Proposed Changes
                </h5>
                <div className="mt-1 space-y-1">
                  {editOption.summary !== undefined && (
                    <p className="text-sm">
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Title:
                      </span>{" "}
                      <span className="text-blue-900 dark:text-blue-100">
                        {editOption.summary}
                      </span>
                    </p>
                  )}
                  {editOption.description !== undefined && (
                    <p className="text-sm">
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Description:
                      </span>{" "}
                      <span className="text-blue-900 dark:text-blue-100">
                        {editOption.description}
                      </span>
                    </p>
                  )}
                  {(editOption.start !== undefined ||
                    editOption.end !== undefined) && (
                    <p className="text-sm">
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        Time:
                      </span>{" "}
                      <span className="text-blue-900 dark:text-blue-100">
                        {editOption.start &&
                          formatSimpleDateTime(editOption.start)}
                        {editOption.start && editOption.end && " - "}
                        {editOption.end &&
                          !editOption.start &&
                          formatSimpleDateTime(editOption.end)}
                      </span>
                    </p>
                  )}
                  {editOption.is_all_day !== undefined && (
                    <p className="text-sm">
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        All-day:
                      </span>{" "}
                      <span className="text-blue-900 dark:text-blue-100">
                        {editOption.is_all_day ? "Yes" : "No"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            className="w-full"
            color="primary"
            variant="flat"
            isDisabled={status === "updated"}
            isLoading={status === "loading"}
            onPress={handleUpdateEvent}
          >
            {status === "updated" ? (
              <Tick02Icon width={22} />
            ) : (
              <PencilEdit02Icon width={22} />
            )}
            {status === "updated" ? "Updated" : "Update Event"}
          </Button>
        </div>
      </div>
    </MotionContainer>
  );
}
