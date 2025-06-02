import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SidebarState {
  isOpen: boolean;
  isMobileOpen: boolean;
  variant:
    | "default"
    | "chat"
    | "mail"
    | "todos"
    | "calendar"
    | "notes"
    | "goals";
}

const initialState: SidebarState = {
  isOpen: true,
  isMobileOpen: false,
  variant: "default",
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    toggleMobileSidebar: (state) => {
      state.isMobileOpen = !state.isMobileOpen;
    },
    setMobileSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileOpen = action.payload;
    },
    setSidebarVariant: (
      state,
      action: PayloadAction<SidebarState["variant"]>,
    ) => {
      state.variant = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setSidebarVariant,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
