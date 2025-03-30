"use client";

import { Spinner } from "@heroui/spinner";
import { useCallback, useEffect, useRef, useState } from "react";

import CalendarCard from "@/components/Calendar/CalendarCard";
import CalendarEventDialog from "@/components/Calendar/CalendarEventDialog";
import CalendarSelector from "@/components/Calendar/CalendarSelector";
import { GoogleCalendarEvent } from "@/types/calendarTypes";

import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { useCalendarPreferences } from "./hooks/useCalendarPreferences";
import { useEventGroups } from "./hooks/useEventGroups";

export default function Calendar() {
  const [selectedEvent, setSelectedEvent] =
    useState<GoogleCalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const {
    loading,
    calendarEvents,
    nextPageToken,
    error,
    fetchEvents,
    resetEvents,
    // eventIdsRef,
  } = useCalendarEvents();

  const groupedEventsByMonth = useEventGroups(calendarEvents);

  const handleCalendarUpdate = useCallback(
    (newCalendars: string[]) => {
      resetEvents();
      if (newCalendars.length) {
        fetchEvents(null, newCalendars);
      }
    },
    [resetEvents, fetchEvents],
  );

  const { calendars, selectedCalendars, fetchCalendars, handleCalendarSelect } =
    useCalendarPreferences(handleCalendarUpdate);

  useEffect(() => {
    fetchCalendars();
  }, []);

  useEffect(() => {
    if (selectedCalendars.length > 0) fetchEvents(null, selectedCalendars);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendars.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !loading &&
          nextPageToken &&
          selectedCalendars.length > 0
        ) {
          fetchEvents(nextPageToken, selectedCalendars);
        }
      },
      { rootMargin: "0px" },
    );
    const currentElement = observerRef.current;
    if (currentElement) observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, [loading, nextPageToken, fetchEvents, selectedCalendars]);

  const handleEventClick = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="relative flex h-full w-full flex-col overflow-y-auto">
        <div className="flex flex-col items-center gap-2 pb-6">
          <div className="sticky top-0 z-20 text-center text-5xl font-bold">
            Your Calendar
          </div>

          {error && (
            <div className="mb-4 w-full max-w-md rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-500">
              {error}
            </div>
          )}

          <CalendarSelector
            calendars={calendars}
            selectedCalendars={selectedCalendars}
            onCalendarSelect={handleCalendarSelect}
          />
        </div>

        <div className="mx-auto max-w-screen-sm">
          {groupedEventsByMonth &&
            Object.entries(groupedEventsByMonth).map(([month, days]) => (
              <div key={month}>
                <div className="sticky top-0 z-10 rounded-lg bg-zinc-900 p-2">
                  <div className="text-md text-center font-medium">{month}</div>
                </div>
                {Object.entries(days).map(([day, events]) => (
                  <div key={day} className="my-2 flex gap-7">
                    <div className="flex max-h-[60px] min-h-[60px] min-w-[60px] max-w-[60px] flex-col items-center justify-center rounded-full bg-zinc-900 text-center text-lg font-bold leading-none text-foreground-500">
                      <div className="text-md font-normal">
                        {day.split(" ")[1]}
                      </div>
                      <div className="text-foreground-600">
                        {day.split(" ")[0]}
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap justify-center gap-4">
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
          <div className="flex h-[80vh] items-center justify-center">
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
