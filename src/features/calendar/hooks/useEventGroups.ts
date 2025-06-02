import { useMemo } from "react";

import { GoogleCalendarEvent } from "@/types/features/calendarTypes";

export const useEventGroups = (calendarEvents: GoogleCalendarEvent[]) => {
  return useMemo(() => {
    const months: { [key: string]: { [key: string]: GoogleCalendarEvent[] } } =
      {};
    calendarEvents.forEach((event) => {
      const eventDate = new Date(
        (event.start.dateTime || event.start.date) as string | number | Date,
      );
      const monthKey = eventDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      const dayKey = eventDate.toLocaleString("default", {
        day: "numeric",
        weekday: "short",
      });
      if (!months[monthKey]) {
        months[monthKey] = {};
      }
      if (!months[monthKey][dayKey]) {
        months[monthKey][dayKey] = [];
      }
      months[monthKey][dayKey].push(event);
    });
    return months;
  }, [calendarEvents]);
};
