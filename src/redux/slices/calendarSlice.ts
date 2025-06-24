import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { calendarApi } from "@/features/calendar/api/calendarApi";
import { CalendarItem } from "@/types/api/calendarApiTypes";
import { GoogleCalendarEvent } from "@/types/features/calendarTypes";

interface CalendarState {
  // Calendar selection state
  calendars: CalendarItem[];
  selectedCalendars: string[];

  // Events state
  events: GoogleCalendarEvent[];
  nextPageToken: string | null;

  // Loading states
  loading: {
    calendars: boolean;
    events: boolean;
  };

  // Error states
  error: {
    calendars: string | null;
    events: string | null;
  };

  // Initialization state
  isInitialized: boolean;
}

const initialState: CalendarState = {
  calendars: [],
  selectedCalendars: [],
  events: [],
  nextPageToken: null,
  loading: {
    calendars: false,
    events: false,
  },
  error: {
    calendars: null,
    events: null,
  },
  isInitialized: false,
};

// Async thunks
export const fetchCalendars = createAsyncThunk(
  "calendar/fetchCalendars",
  async (_, { rejectWithValue }) => {
    try {
      const response = await calendarApi.fetchCalendars();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch calendars",
      );
    }
  },
);

export const fetchEvents = createAsyncThunk(
  "calendar/fetchEvents",
  async (
    {
      pageToken,
      calendarIds,
      reset = false,
    }: {
      pageToken?: string | null;
      calendarIds: string[];
      reset?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await calendarApi.fetchMultipleCalendarEvents(
        calendarIds,
        pageToken,
      );
      return { ...response, reset };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch events",
      );
    }
  },
);

// Slice
const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {
    setSelectedCalendars: (state, action: PayloadAction<string[]>) => {
      state.selectedCalendars = action.payload;
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "selectedCalendars",
          JSON.stringify(action.payload),
        );
      }
    },
    toggleCalendarSelection: (state, action: PayloadAction<string>) => {
      const calendarId = action.payload;
      const index = state.selectedCalendars.indexOf(calendarId);

      if (index === -1) {
        state.selectedCalendars.push(calendarId);
      } else {
        state.selectedCalendars.splice(index, 1);
      }

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "selectedCalendars",
          JSON.stringify(state.selectedCalendars),
        );
      }
    },
    resetEvents: (state) => {
      state.events = [];
      state.nextPageToken = null;
      state.error.events = null;
    },
    clearCalendarError: (
      state,
      action: PayloadAction<"calendars" | "events">,
    ) => {
      state.error[action.payload] = null;
    },
    initializeFromStorage: (state) => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selectedCalendars");
        if (saved) {
          try {
            state.selectedCalendars = JSON.parse(saved);
          } catch {
            // Invalid JSON, ignore
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch calendars
    builder
      .addCase(fetchCalendars.pending, (state) => {
        state.loading.calendars = true;
        state.error.calendars = null;
      })
      .addCase(fetchCalendars.fulfilled, (state, action) => {
        state.loading.calendars = false;
        state.calendars = action.payload;
        state.isInitialized = true;

        // Auto-select calendars if none selected and we have calendars
        if (state.selectedCalendars.length === 0 && action.payload.length > 0) {
          // Select primary calendar by default
          const primaryCalendar = action.payload.find((cal) => cal.primary);
          if (primaryCalendar) {
            state.selectedCalendars = [primaryCalendar.id];
            if (typeof window !== "undefined") {
              localStorage.setItem(
                "selectedCalendars",
                JSON.stringify([primaryCalendar.id]),
              );
            }
          }
        }
      })
      .addCase(fetchCalendars.rejected, (state, action) => {
        state.loading.calendars = false;
        state.error.calendars = action.payload as string;
        state.isInitialized = true;
      });

    // Fetch events
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading.events = true;
        state.error.events = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading.events = false;

        if (action.payload.reset) {
          state.events = action.payload.events;
        } else {
          state.events = [...state.events, ...action.payload.events];
        }

        state.nextPageToken = action.payload.nextPageToken;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading.events = false;
        state.error.events = action.payload as string;
      });
  },
});

export const {
  setSelectedCalendars,
  toggleCalendarSelection,
  resetEvents,
  clearCalendarError,
  initializeFromStorage,
} = calendarSlice.actions;

export default calendarSlice.reducer;
