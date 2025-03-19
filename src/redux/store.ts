"use client";

import { configureStore } from "@reduxjs/toolkit";

import convoReducer from "./slices/conversationSlice";
import conversationReducer from "./slices/conversationsSlice";
import loadingReducer from "./slices/loadingSlice";
import loginModalReducer from "./slices/loginModalSlice";
import userReducer from "./slices/userSlice";
import imageDialogReducer from "./slices/imageDialogSlice";
import calendarModalReducer from "./slices/calendarModalSlice";

export const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    user: userReducer,
    loading: loadingReducer,
    conversation: convoReducer,
    conversations: conversationReducer,
    imageDialog: imageDialogReducer,
    calendarModal: calendarModalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
