import { Spinner } from "@heroui/spinner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CalendarEventDialog from "./CalendarEventDialog";
import CalendarSelector from "./CalendarSelector";
import { GoogleCalendar, GoogleCalendarEvent } from "@/types/calendarTypes";
import { apiauth } from "@/utils/apiaxios";
import CalendarCard from "./CalendarCard";
import { toast } from "sonner";
import { Button } from "@heroui/button";
import { CalendarAdd01Icon } from "../Misc/icons";

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export default function Calendar() {
  const [loading, setLoading] = useState<boolean>(true);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>(
    []
  );
  const [selectedEvent, setSelectedEvent] =
    useState<GoogleCalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);
  const eventIdsRef = useRef<Set<string>>(new Set());
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);

  // Fetch events; if pageToken is null, we are (re)loading so we show the spinner.
  const fetchEvents = useCallback(
    async (
      pageToken: string | null = null,
      calendarIds: string[] | null = null
    ) => {
      if (!pageToken) {
        setLoading(true);
      }
      try {
        const allEvents: GoogleCalendarEvent[] = [];
        const calendarsToFetch = calendarIds || selectedCalendars;
        toast.loading("Fetching Events...", { id: "fetching" });
        for (const calendarId of calendarsToFetch) {
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
            // If there are no more pages for this calendar, clear nextPageToken
            setNextPageToken(null);
          }
        }
        // toast.dismiss("Fetching Events...");
        toast.success("Fetched Events!", { id: "fetching" });

        // Deduplicate events
        const newEvents = allEvents.filter(
          (event) => !eventIdsRef.current.has(event.id)
        );
        newEvents.forEach((event) => eventIdsRef.current.add(event.id));
        // Merge and sort events
        setCalendarEvents((prev) => {
          const mergedEvents = [...prev, ...newEvents];
          return mergedEvents.sort((a, b) => {
            const dateA = new Date(a.start.dateTime || a.start.date || "");
            const dateB = new Date(b.start.dateTime || b.start.date || "");
            return dateA.getTime() - dateB.getTime();
          });
        });
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCalendars]
  );

  // Fetch the list of calendars and the user's preferences.
  const fetchCalendars = useCallback(async () => {
    try {
      const calendarListResponse = await apiauth.get("/calendar/list");
      const calendarItems = calendarListResponse.data.items;
      setCalendars(calendarItems);

      // Attempt to fetch user calendar preferences.
      let storedSelectedCalendars: string[] = [];
      try {
        const preferencesResponse = await apiauth.get("/calendar/preferences");
        if (preferencesResponse.data.selectedCalendars) {
          storedSelectedCalendars = preferencesResponse.data.selectedCalendars;
        }
      } catch (err) {
        console.error("No calendar preferences found, using primary calendar.");
      }
      // Default to primary calendar if no preferences.
      if (!storedSelectedCalendars.length) {
        const primaryCalendar = calendarItems.find(
          (cal: { primary: boolean }) => cal.primary
        );
        if (primaryCalendar) {
          storedSelectedCalendars = [primaryCalendar.id];
          await apiauth.put("/calendar/preferences", {
            selected_calendars: [primaryCalendar.id],
          });
        }
      }
      setSelectedCalendars(storedSelectedCalendars);
      // Reset events and fetch for these calendars
      setCalendarEvents([]);
      eventIdsRef.current = new Set();
      await fetchEvents(null, storedSelectedCalendars);
    } catch (error) {
      console.error("Error fetching calendars:", error);
    }
  }, []); // Empty dependency array as we want to call this on mount

  // Debounced function to update calendar preferences.
  const updatePreferences = useCallback(
    debounce(async (newSelection: string[]) => {
      try {
        await apiauth.put("/calendar/preferences", {
          selected_calendars: newSelection,
        });
      } catch (error) {
        console.error("Error updating calendar preferences:", error);
      }
    }, 300),
    []
  );

  // Handle calendar selection: if deselected, remove events; if added, fetch events.
  const handleCalendarSelect = useCallback(
    (calendarId: string) => {
      if (loading) return;

      setSelectedCalendars((prev) => {
        const isSelected = prev.includes(calendarId);
        const newSelection = isSelected
          ? prev.filter((id) => id !== calendarId)
          : [...prev, calendarId];

        if (isSelected) {
          // Remove events for the deselected calendar.
          setCalendarEvents((prevEvents) => {
            const updatedEvents = prevEvents.filter(
              (event) => event.organizer.email !== calendarId
            );
            eventIdsRef.current = new Set(updatedEvents.map((e) => e.id));
            return updatedEvents;
          });
        } else {
          // Fetch events for the newly added calendar.
          fetchEvents(null, [calendarId]);
        }
        updatePreferences(newSelection);
        return newSelection;
      });
    },
    [loading, fetchEvents, updatePreferences]
  );

  // Set up the Intersection Observer for infinite scrolling.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && nextPageToken) {
          fetchEvents(nextPageToken);
        }
      },
      { rootMargin: "0px" }
    );
    const currentElement = observerRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }
    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [loading, nextPageToken, fetchEvents]);

  // Group events by month and day.
  const groupedEventsByMonth = useMemo(() => {
    const months: { [key: string]: { [key: string]: GoogleCalendarEvent[] } } =
      {};
    calendarEvents.forEach((event) => {
      const eventDate = new Date(
        (event.start.dateTime || event.start.date) as string | number | Date
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

  // Fetch calendars on mount.
  useEffect(() => {
    fetchCalendars();
  }, [fetchCalendars]);

  const handleEventClick = useCallback((event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  }, []);

  return (
    <>
      <div className="flex flex-col h-full relative overflow-y-scroll w-full">
        <div className="flex items-center flex-col gap-2 pb-6">
          <div className="font-bold text-center text-5xl  sticky top-0 z-20">
            Your Calendar
          </div>

          <Button
            color="primary"
            variant="flat"
            // size="sm"
            isDisabled
            onPress={() => setIsAddDialogOpen(true)}
            // className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <CalendarAdd01Icon color={undefined} width={17} />
            Add event
          </Button>

          <CalendarSelector
            calendars={calendars}
            selectedCalendars={selectedCalendars}
            onCalendarSelect={handleCalendarSelect}
          />
        </div>

        <div className="max-w-screen-sm mx-auto">
          {Object.entries(groupedEventsByMonth).map(([month, days]) => (
            <div key={month}>
              {/* Sticky Month Header */}
              <div className="sticky top-0 z-10 p-2 bg-zinc-900 rounded-lg">
                <h2 className="text-lg font-medium text-center">{month}</h2>
              </div>
              {Object.entries(days).map(([day, events]) => (
                <div key={day} className="flex gap-7 my-2">
                  <div className="text-lg font-bold text-center min-w-[60px] max-w-[60px] min-h-[60px] max-h-[60px] rounded-full bg-zinc-900 text-foreground-500 flex items-center justify-center leading-none flex-col">
                    <div className="font-normal text-md">
                      {day.split(" ")[1]}
                    </div>
                    <div className="text-foreground-600">
                      {day.split(" ")[0]}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center w-full">
                    {events.map((event) => (
                      <CalendarCard
                        key={event.id}
                        calendars={calendars}
                        event={event}
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {loading && (
          <div className="h-[80vh] flex items-center justify-center">
            <Spinner />
          </div>
        )}
        <div ref={observerRef} className="h-1" />
      </div>
      {selectedEvent && (
        <CalendarEventDialog
          event={selectedEvent}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}

      {isAddDialogOpen && (
        <CalendarEventDialog
          event={null}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="create"
        />
      )}
    </>
  );
}
