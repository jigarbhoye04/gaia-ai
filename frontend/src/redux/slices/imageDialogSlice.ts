import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ImageResult } from "@/types/features/convoTypes";

interface ImageDialogState {
  isOpen: boolean;
  selectedImage: ImageResult | null;
}

const initialState: ImageDialogState = {
  isOpen: false,
  selectedImage: null,
};

export const imageDialogSlice = createSlice({
  name: "imageDialog",
  initialState,
  reducers: {
    openImageDialog: (state, action: PayloadAction<ImageResult>) => {
      state.isOpen = true;
      state.selectedImage = action.payload;
    },
    closeImageDialog: (state) => {
      state.isOpen = false;
      state.selectedImage = null;
    },
  },
});

export const { openImageDialog, closeImageDialog } = imageDialogSlice.actions;
export default imageDialogSlice.reducer;
