// src/redux/slices/loginModalSlice.ts
import { createSlice } from "@reduxjs/toolkit";

const loginModalSlice = createSlice({
  name: "loginModal",
  initialState: { open: false },
  reducers: {
    setLoginModalOpen: (state, action) => {
      state.open = action.payload;
    },
  },
});

export const { setLoginModalOpen } = loginModalSlice.actions;
export default loginModalSlice.reducer;
