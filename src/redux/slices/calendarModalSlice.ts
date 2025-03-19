import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CalendarEvent } from "@/types/calendarTypes";

interface CalendarModalState {
  isOpen: boolean;
  currentEvent: CalendarEvent | null;
  editedEvent: CalendarEvent | null;
  status: "idle" | "loading";
  isDummyEvent: boolean;
  onEventSuccess?: () => void;
}

const initialState: CalendarModalState = {
  isOpen: false,
  currentEvent: null,
  editedEvent: null,
  status: "idle",
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
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.currentEvent = null;
      state.editedEvent = null;
      state.status = "idle";
      state.onEventSuccess = undefined;
    },
    updateEditedEvent: (state, action: PayloadAction<CalendarEvent>) => {
      state.editedEvent = action.payload;
    },
    setStatus: (state, action: PayloadAction<"idle" | "loading">) => {
      state.status = action.payload;
    },
  },
});

export const { openModal, closeModal, updateEditedEvent, setStatus } =
  calendarModalSlice.actions;
export default calendarModalSlice.reducer;
