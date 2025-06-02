import { useCallback, useMemo, useRef, useState } from "react";

import { debounce } from "@/lib/utils";
import { GoogleCalendar } from "@/types/features/calendarTypes";

import { calendarApi } from "../api/calendarApi";

export const useCalendarPreferences = (
  onCalendarsUpdate: (calendars: string[]) => void,
) => {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const isInitialFetchRef = useRef<boolean>(true);

  const stableOnCalendarsUpdate = useCallback(
    (updatedCalendars: string[]) => onCalendarsUpdate(updatedCalendars),
    [onCalendarsUpdate],
  );

  const updatePreferences = useMemo(
    () =>
      debounce(async (newSelection: string[]) => {
        try {
          await calendarApi.updateCalendarPreferences(newSelection);
        } catch (error) {
          console.error("Error updating calendar preferences:", error);
        }
      }, 300),
    [],
  );

  const fetchCalendars = useCallback(async () => {
    const calendarItems = await calendarApi.fetchCalendarList();
    setCalendars(calendarItems);

    let storedSelectedCalendars: string[] = [];
    try {
      storedSelectedCalendars = await calendarApi.fetchCalendarPreferences();
    } catch (err) {
      console.error(
        "No calendar preferences found, using primary calendar.",
        err,
      );
    }

    if (!storedSelectedCalendars.length) {
      const primaryCalendar = calendarItems.find(
        (cal: { primary: boolean }) => cal.primary,
      );
      if (primaryCalendar) {
        storedSelectedCalendars = [primaryCalendar.id];
        await calendarApi.updateCalendarPreferences([primaryCalendar.id]);
      }
    }

    // Always update state with the fetched preferences
    setSelectedCalendars(storedSelectedCalendars);

    // Only trigger calendar update on initial fetch
    if (isInitialFetchRef.current && storedSelectedCalendars.length > 0) {
      stableOnCalendarsUpdate(storedSelectedCalendars);
    }

    isInitialFetchRef.current = false;
  }, [stableOnCalendarsUpdate]);

  const handleCalendarSelect = useCallback(
    (calendarId: string) => {
      setSelectedCalendars((prev) => {
        const isSelected = prev.includes(calendarId);
        const newSelection = isSelected
          ? prev.filter((id) => id !== calendarId)
          : [...prev, calendarId];

        updatePreferences(newSelection);
        stableOnCalendarsUpdate(newSelection);
        return newSelection;
      });
    },
    [updatePreferences, stableOnCalendarsUpdate],
  );

  return {
    calendars,
    selectedCalendars,
    fetchCalendars,
    handleCalendarSelect,
  };
};
