import { Button } from "@heroui/button";
import React, { useCallback, useState } from "react";
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
      <div className="mt-1 flex flex-col gap-2 rounded-xl bg-zinc-900 p-2">
        <div className="relative flex w-full flex-row gap-3 rounded-xl rounded-l-none bg-primary/20 p-3 pt-1 pr-1">
          <div className="absolute inset-0 w-1 rounded-full bg-primary" />
          <div className="flex flex-1 flex-col pl-1">
            <div className="flex w-full items-center justify-between">
              <div className="font-medium">
                {editOption.summary || editOption.original_summary}
              </div>
            </div>

            {/* Original Event Details */}
            <div className="mt-1 text-xs text-primary">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                    Update Event
                  </span>
                </div>

                <div className="font-medium">
                  Original: {editOption.original_summary}
                </div>

                {editOption.original_description && (
                  <div className="text-xs opacity-70">
                    {editOption.original_description}
                  </div>
                )}

                <div className="text-xs opacity-70">
                  {formatDate(
                    editOption.original_start,
                    editOption.original_end,
                  )}
                </div>
              </div>

              {/* Changes */}
              {hasChanges && (
                <div className="mt-2 border-t border-primary/20 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-primary">
                      Proposed Changes:
                    </div>
                    {editOption.summary !== undefined && (
                      <div className="flex items-center text-xs">
                        <span className="w-16 min-w-16 font-medium">
                          Title:
                        </span>
                        <span className="ml-1">{editOption.summary}</span>
                      </div>
                    )}
                    {editOption.description !== undefined && (
                      <div className="flex items-start text-xs">
                        <span className="w-16 min-w-16 font-medium">Desc:</span>
                        <span className="ml-1">{editOption.description}</span>
                      </div>
                    )}
                    {(editOption.start !== undefined ||
                      editOption.end !== undefined) && (
                      <div className="flex items-start text-xs">
                        <span className="w-16 min-w-16 font-medium">Time:</span>
                        <span className="ml-1">
                          {editOption.start &&
                            formatSimpleDateTime(editOption.start)}
                          {editOption.start && editOption.end && " - "}
                          {editOption.end &&
                            !editOption.start &&
                            formatSimpleDateTime(editOption.end)}
                        </span>
                      </div>
                    )}
                    {editOption.is_all_day !== undefined && (
                      <div className="flex items-center text-xs">
                        <span className="w-16 min-w-16 font-medium">
                          All-day:
                        </span>
                        <span className="ml-1">
                          {editOption.is_all_day ? "Yes" : "No"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          className="w-full"
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
    </MotionContainer>
  );
}
