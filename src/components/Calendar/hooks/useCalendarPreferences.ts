import { useState, useCallback, useMemo } from 'react';
import { GoogleCalendar } from '@/types/calendarTypes';
import { apiauth } from '@/utils/apiaxios';
import { debounce } from '@/lib/utils';

export const useCalendarPreferences = (onCalendarsUpdate: (calendars: string[]) => void) => {
    const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
    const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

    const stableOnCalendarsUpdate = useCallback(onCalendarsUpdate, []);

    const updatePreferences = useMemo(
        () =>
            debounce(async (newSelection: string[]) => {
                try {
                    await apiauth.put("/calendar/preferences", {
                        selected_calendars: newSelection,
                    });
                } catch (error) {
                    console.error("Error updating calendar preferences:", error);
                }
            }, 300),
        [],
    );

    const fetchCalendars = useCallback(async () => {
        try {
            const calendarListResponse = await apiauth.get("/calendar/list");
            const calendarItems = calendarListResponse.data.items;
            setCalendars(calendarItems);

            let storedSelectedCalendars: string[] = [];
            try {
                const preferencesResponse = await apiauth.get("/calendar/preferences");
                if (preferencesResponse.data.selectedCalendars) {
                    storedSelectedCalendars = preferencesResponse.data.selectedCalendars;
                }
            } catch (err) {
                console.error("No calendar preferences found, using primary calendar.", err);
            }

            if (!storedSelectedCalendars.length) {
                const primaryCalendar = calendarItems.find((cal: { primary: boolean; }) => cal.primary);
                if (primaryCalendar) {
                    storedSelectedCalendars = [primaryCalendar.id];
                    await apiauth.put("/calendar/preferences", {
                        selected_calendars: [primaryCalendar.id],
                    });
                }
            }

            setSelectedCalendars((prev) => {
                if (JSON.stringify(prev) !== JSON.stringify(storedSelectedCalendars)) {
                    return storedSelectedCalendars;
                }
                return prev;
            });

            if (!storedSelectedCalendars.length) return;
            stableOnCalendarsUpdate(storedSelectedCalendars);
        } catch (error) {
            console.error("Error fetching calendars:", error);
        }
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