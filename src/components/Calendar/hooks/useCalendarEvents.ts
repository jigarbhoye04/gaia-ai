import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { GoogleCalendarEvent } from '@/types/calendarTypes';
import { apiauth } from '@/utils/apiaxios';

export const useCalendarEvents = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const eventIdsRef = useRef<Set<string>>(new Set());

    const fetchEvents = useCallback(
        async (pageToken: string | null = null, calendarIds: string[] | null = null) => {
            if (!pageToken) {
                setLoading(true);
            }
            try {
                const allEvents: GoogleCalendarEvent[] = [];

                if (!calendarIds?.length) {
                    toast.error("No calendars selected");
                    setLoading(false);
                    return;
                }

                toast.loading("Fetching Events...", { id: "fetching" });

                for (const calendarId of calendarIds) {
                    try {
                        const response = await apiauth.get<{
                            events: GoogleCalendarEvent[];
                            nextPageToken: string | null;
                        }>(`/calendar/${calendarId}/events`, {
                            params: { page_token: pageToken },
                        });
                        allEvents.push(...response.data.events);
                        if (response.data.nextPageToken) {
                            setNextPageToken(response.data.nextPageToken);
                        } else {
                            setNextPageToken(null);
                        }
                    } catch (err) {
                        console.error(`Error fetching events for calendar ${calendarId}:`, err);
                        toast.error(`Failed to fetch events from ${calendarId}`);
                    }
                }

                toast.success("Fetched Events!", { id: "fetching" });

                const newEvents = allEvents.filter(
                    (event) => !eventIdsRef.current.has(event.id),
                );
                newEvents.forEach((event) => eventIdsRef.current.add(event.id));

                setCalendarEvents((prev) => {
                    const mergedEvents = [...prev, ...newEvents];
                    return mergedEvents.sort((a, b) => {
                        const dateA = new Date(a.start.dateTime || a.start.date || "");
                        const dateB = new Date(b.start.dateTime || b.start.date || "");
                        return dateA.getTime() - dateB.getTime();
                    });
                });
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Error fetching calendar events";
                setError(errorMessage);
                console.error("Error fetching calendar events:", err);
                toast.error(errorMessage);
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
        eventIdsRef
    };
};