"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type HeaderComponentType =
    | "chat"
    | "mail"
    | "goals"
    | "calendar"
    | "browser"
    | "notes"
    | "custom"
    | "default";

interface HeaderState {
    currentHeaderType: HeaderComponentType;
    headerProps: Record<string, any> | null;
}

const initialState: HeaderState = {
    currentHeaderType: "default",
    headerProps: null,
};

const headerSlice = createSlice({
    name: "header",
    initialState,
    reducers: {
        setHeaderComponent: (state, action: PayloadAction<{
            headerType: HeaderComponentType;
            props?: Record<string, any>;
        }>) => {
            state.currentHeaderType = action.payload.headerType;
            state.headerProps = action.payload.props || null;
        },
    },
});

export const { setHeaderComponent } = headerSlice.actions;
export default headerSlice.reducer;