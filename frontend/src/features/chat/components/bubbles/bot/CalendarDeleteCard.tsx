import { Button } from "@heroui/button";
import React, { useCallback, useState } from "react";
import { toast } from "sonner";

import { Cancel01Icon, Tick02Icon } from "@/components/shared/icons";
import { calendarApi } from "@/features/calendar/api/calendarApi";
import { MotionContainer } from "@/layouts/MotionContainer";
import {
  CalendarDeleteOptions,
  CalendarEventDateTime,
} from "@/types/features/calendarTypes";
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
      <div className="mt-1 flex flex-col gap-2 rounded-xl bg-zinc-900 p-2">
        <div className="relative flex w-full flex-row gap-3 rounded-xl rounded-l-none bg-red-500/20 p-3 pt-1 pr-1">
          <div className="absolute inset-0 w-1 rounded-full bg-red-500" />
          <div className="flex flex-1 flex-col pl-1">
            <div className="flex w-full items-center justify-between">
              <div className="font-medium">{deleteOption.summary}</div>
            </div>
            <div className="mt-1 text-xs text-red-500">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-red-500/20 px-2 py-1 text-xs font-medium text-red-500">
                    Delete Event
                  </span>
                </div>

                {deleteOption.description && (
                  <div className="text-xs opacity-70">
                    {deleteOption.description}
                  </div>
                )}

                <div className="text-xs opacity-70">
                  {formatDate(deleteOption.start, deleteOption.end)}
                </div>
              </div>
            </div>
          </div>
        </div>

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
    </MotionContainer>
  );
}
