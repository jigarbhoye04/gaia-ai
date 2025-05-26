"use client";

import { configureStore } from "@reduxjs/toolkit";

import calendarModalReducer from "./slices/calendarModalSlice";
import convoReducer from "./slices/conversationSlice";
import conversationReducer from "./slices/conversationsSlice";
import headerReducer from "./slices/headerSlice";
import imageDialogReducer from "./slices/imageDialogSlice";
import loadingReducer from "./slices/loadingSlice";
import loadingTextReducer from "./slices/loadingTextSlice";
import loginModalReducer from "./slices/loginModalSlice";
import todoReducer from "./slices/todoSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    loginModal: loginModalReducer,
    user: userReducer,
    loading: loadingReducer,
    loadingText: loadingTextReducer,
    conversation: convoReducer,
    conversations: conversationReducer,
    imageDialog: imageDialogReducer,
    calendarModal: calendarModalReducer,
    header: headerReducer,
    todos: todoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
