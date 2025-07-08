"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ToolInfo {
  toolName?: string;
  toolCategory?: string;
}

interface LoadingTextState {
  loadingText: string;
  toolInfo?: ToolInfo;
}

const initialState: LoadingTextState = {
  loadingText: "GAIA is thinking",
};

interface SetLoadingTextPayload {
  text: string;
  toolInfo?: ToolInfo;
}

const loadingTextSlice = createSlice({
  name: "loadingText",
  initialState,
  reducers: {
    setLoadingText: (
      state,
      action: PayloadAction<string | SetLoadingTextPayload>,
    ) => {
      if (typeof action.payload === "string") {
        // Backward compatibility with simple string
        state.loadingText = action.payload;
        state.toolInfo = undefined;
      } else {
        // Enhanced format with tool info
        state.loadingText = action.payload.text;
        state.toolInfo = action.payload.toolInfo;
      }
    },
    resetLoadingText: (state) => {
      state.loadingText = initialState.loadingText;
      state.toolInfo = undefined;
    },
  },
});

export const { setLoadingText, resetLoadingText } = loadingTextSlice.actions;
export default loadingTextSlice.reducer;
