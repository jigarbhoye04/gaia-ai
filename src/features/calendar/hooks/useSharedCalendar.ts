"use client";

import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  clearCalendarError,
  fetchCalendars,
  fetchEvents,
  initializeFromStorage,
  resetEvents,
  setSelectedCalendars as setSelectedCalendarsAction,
  toggleCalendarSelection,
} from "@/redux/slices/calendarSlice";
import { AppDispatch, RootState } from "@/redux/store";

export const useSharedCalendar = () => {
  const dispatch: AppDispatch = useDispatch();

  const {
    calendars,
    selectedCalendars,
    events,
    nextPageToken,
    loading,
    error,
    isInitialized,
  } = useSelector((state: RootState) => state.calendar);

  // Initialize from localStorage on mount
  useEffect(() => {
    dispatch(initializeFromStorage());
  }, [dispatch]);

  // Load calendars
  const loadCalendars = useCallback(async () => {
    return dispatch(fetchCalendars());
  }, [dispatch]);

  // Load events
  const loadEvents = useCallback(
    async (
      pageToken?: string | null,
      calendarIds?: string[],
      reset = false,
    ) => {
      const calendarsToUse = calendarIds || selectedCalendars;
      if (calendarsToUse.length === 0) return;

      return dispatch(
        fetchEvents({
          pageToken,
          calendarIds: calendarsToUse,
          reset,
        }),
      );
    },
    [dispatch, selectedCalendars],
  );

  // Clear events
  const clearEvents = useCallback(() => {
    dispatch(resetEvents());
  }, [dispatch]);

  // Handle calendar selection
  const handleCalendarSelect = useCallback(
    (calendarId: string) => {
      dispatch(toggleCalendarSelection(calendarId));
    },
    [dispatch],
  );

  // Set selected calendars (bulk operation)
  const setSelectedCalendars = useCallback(
    (calendarIds: string[]) => {
      dispatch(setSelectedCalendarsAction(calendarIds));
    },
    [dispatch],
  );

  // Clear errors
  const clearError = useCallback(
    (errorType: "calendars" | "events") => {
      dispatch(clearCalendarError(errorType));
    },
    [dispatch],
  );

  return {
    // State
    calendars,
    selectedCalendars,
    events,
    nextPageToken,
    loading,
    error,
    isInitialized,

    // Actions
    loadCalendars,
    loadEvents,
    clearEvents,
    handleCalendarSelect,
    setSelectedCalendars,
    clearError,
  };
};
