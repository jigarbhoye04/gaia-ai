// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserState {
  profilePicture: string;
  name: string;
  email: string;
}

const initialState: UserState = {
  profilePicture: "",
  name: "",
  email: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Sets user information
    setUser(state, action: PayloadAction<UserState>) {
      state.profilePicture = action.payload.profilePicture;
      state.name = action.payload.name;
      state.email = action.payload.email;
    },
    // Clears user information
    clearUser(state) {
      state.profilePicture = "";
      state.name = "";
      state.email = "";
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
