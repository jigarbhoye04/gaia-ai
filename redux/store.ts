"use client";

import { configureStore } from "@reduxjs/toolkit";
import loginModalReducer from "./slices/loginModalSlice";
import userReducer from "./slices/userSlice";
import convoReducer from "./slices/convoSlice";
import loadingReducer from "./slices/loadingSlice";

export const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    user: userReducer,
    loading: loadingReducer,
    convo: convoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
