import { useCallback, useRef, useState } from "react";

import { GoogleCalendarEvent } from "@/types/features/calendarTypes";

import { calendarApi } from "../api/calendarApi";

export const useCalendarEvents = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(
    [],
  );
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventIdsRef = useRef<Set<string>>(new Set());

  const fetchEvents = useCallback(
    async (
      pageToken: string | null = null,
      calendarIds: string[] | null = null,
    ) => {
      if (!pageToken) {
        setLoading(true);
      }
      try {
        if (!calendarIds?.length) {
          setLoading(false);
          return;
        }

        const response = await calendarApi.fetchMultipleCalendarEvents(
          calendarIds,
          pageToken,
        );

        const uniqueEvents = response.events.filter(
          (event) => event.id && !eventIdsRef.current.has(event.id),
        );

        uniqueEvents.forEach((event) => {
          if (event.id) eventIdsRef.current.add(event.id);
        });

        setCalendarEvents((prev) => {
          const mergedEvents = pageToken
            ? [...prev, ...uniqueEvents]
            : uniqueEvents;
          return mergedEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date || "");
            const dateB = new Date(b.start.dateTime || b.start.date || "");
            return dateA.getTime() - dateB.getTime();
          });
        });

        setNextPageToken(response.nextPageToken);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error fetching calendar events";
        setError(errorMessage);
        console.error("Error fetching calendar events:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const resetEvents = () => {
    setCalendarEvents([]);
    eventIdsRef.current = new Set();
  };

  return {
    loading,
    calendarEvents,
    nextPageToken,
    error,
    fetchEvents,
    resetEvents,
    eventIdsRef,
  };
};
