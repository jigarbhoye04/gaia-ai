"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingTextState {
  loadingText: string;
}

const initialState: LoadingTextState = {
  loadingText: "GAIA is thinking",
};

const loadingTextSlice = createSlice({
  name: "loadingText",
  initialState,
  reducers: {
    setLoadingText: (state, action: PayloadAction<string>) => {
      state.loadingText = action.payload;
    },
    resetLoadingText: (state) => {
      state.loadingText = initialState.loadingText;
    },
  },
});

export const { setLoadingText, resetLoadingText } = loadingTextSlice.actions;
export default loadingTextSlice.reducer;
