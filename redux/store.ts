"use client";

import { configureStore } from "@reduxjs/toolkit";
import loginModalReducer from "./slices/loginModalSlice";
import userReducer from "./slices/userSlice";
import convoReducer from "./slices/conversationSlice";
import loadingReducer from "./slices/loadingSlice";

export const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    user: userReducer,
    loading: loadingReducer,
    conversation: convoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
