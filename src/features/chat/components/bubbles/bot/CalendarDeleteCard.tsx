import { Button } from "@heroui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Cancel01Icon, Tick02Icon } from "@/components/shared/icons";
import { calendarApi } from "@/features/calendar/api/calendarApi";
import { MotionContainer } from "@/layouts/MotionContainer";
import {
  CalendarDeleteOptions,
  CalendarEventDateTime,
} from "@/types/features/convoTypes";
import {
  formatAllDayDate,
  formatAllDayDateRange,
  formatTimedEventDate,
  getEventDurationText,
  isDateOnly,
} from "@/utils/date/calendarDateUtils";

interface CalendarDeleteCardProps {
  deleteOption: CalendarDeleteOptions;
}

export function CalendarDeleteCard({ deleteOption }: CalendarDeleteCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "deleted">("idle");

  const handleDeleteEvent = useCallback(async () => {
    try {
      setStatus("loading");

      await calendarApi.deleteEventByAgent({
        event_id: deleteOption.event_id,
        calendar_id: deleteOption.calendar_id,
        summary: deleteOption.summary,
      });

      setStatus("deleted");
    } catch (error) {
      console.error("Error deleting event:", error);
      setStatus("idle");
      toast.error("Failed to delete event");
    }
  }, [deleteOption]);

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

  return (
    <MotionContainer>
      <div className="w-full max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-950/20">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start space-x-2">
            <Cancel01Icon className="mt-1 h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                Delete Event
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                Found event matching: "{deleteOption.original_query}"
              </p>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 rounded border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-red-950/30">
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              {deleteOption.summary}
            </h3>

            {deleteOption.description && (
              <p className="text-sm text-red-700 dark:text-red-300">
                {deleteOption.description}
              </p>
            )}

            <p className="text-sm text-red-600 dark:text-red-400">
              {formatDate(deleteOption.start, deleteOption.end)}
            </p>
          </div>

          {/* Action Button */}
          <Button
            className="w-full"
            color="danger"
            variant="flat"
            isDisabled={status === "deleted"}
            isLoading={status === "loading"}
            onPress={handleDeleteEvent}
          >
            {status === "deleted" ? (
              <Tick02Icon width={22} />
            ) : (
              <Cancel01Icon width={22} />
            )}
            {status === "deleted" ? "Deleted" : "Delete Event"}
          </Button>
        </div>
      </div>
    </MotionContainer>
  );
}
