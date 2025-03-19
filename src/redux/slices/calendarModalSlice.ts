import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { CalendarEvent } from "@/types/calendarTypes";

interface CalendarModalState {
  isOpen: boolean;
  currentEvent: CalendarEvent | null;
  editedEvent: CalendarEvent | null;
  status: "idle" | "loading" | "error";
  error: string | null;
  isDummyEvent: boolean;
  onEventSuccess?: () => void;
}

const initialState: CalendarModalState = {
  isOpen: false,
  currentEvent: null,
  editedEvent: null,
  status: "idle",
  error: null,
  isDummyEvent: false,
};

const calendarModalSlice = createSlice({
  name: "calendarModal",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{
        event: CalendarEvent;
        isDummy?: boolean;
        onSuccess?: () => void;
      }>,
    ) => {
      state.isOpen = true;
      state.currentEvent = action.payload.event;
      state.editedEvent = action.payload.event;
      state.isDummyEvent = action.payload.isDummy || false;
      state.onEventSuccess = action.payload.onSuccess;
      state.error = null; // Clear any previous errors
      state.status = "idle";
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.currentEvent = null;
      state.editedEvent = null;
      state.status = "idle";
      state.error = null;
      state.onEventSuccess = undefined;
    },
    updateEditedEvent: (state, action: PayloadAction<CalendarEvent>) => {
      state.editedEvent = action.payload;
      state.error = null; // Clear any validation errors when event is updated
    },
    setStatus: (state, action: PayloadAction<"idle" | "loading" | "error">) => {
      state.status = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = "error";
    },
    clearError: (state) => {
      state.error = null;
      state.status = "idle";
    },
    resetState: () => initialState,
  },
});

export const {
  openModal,
  closeModal,
  updateEditedEvent,
  setStatus,
  setError,
  clearError,
  resetState,
} = calendarModalSlice.actions;

export default calendarModalSlice.reducer;
