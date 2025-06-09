"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HeaderComponentType =
  | "chat"
  | "mail"
  | "goals"
  | "calendar"
  | "browser"
  | "notes"
  | "settings"
  | "custom"
  | "default";

// Define a proper type for header props
export interface HeaderProps {
  customContent?: boolean;
  jsxContent?: boolean;
  // Allow for any component-specific props
  // Use a separate field for component props to avoid type conflicts
  componentProps?: Record<string, unknown>;
  [key: string]: unknown; // Maintain backward compatibility
}

interface HeaderState {
  currentHeaderType: HeaderComponentType;
  headerProps: HeaderProps | null;
}

const initialState: HeaderState = {
  currentHeaderType: "default",
  headerProps: null,
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    setHeaderComponent: (
      state,
      action: PayloadAction<{
        headerType: HeaderComponentType;
        props?: HeaderProps;
      }>,
    ) => {
      state.currentHeaderType = action.payload.headerType;
      state.headerProps = action.payload.props || null;
    },
  },
});

export const { setHeaderComponent } = headerSlice.actions;
export default headerSlice.reducer;
