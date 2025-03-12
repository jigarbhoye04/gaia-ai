"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MessageType } from "@/types/convoTypes";

interface ConvoState {
  messages: MessageType[];
}

const initialState: ConvoState = {
  messages: [],
};

const convoSlice = createSlice({
  name: "convo",
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<MessageType[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<MessageType>) => {
      state.messages.push(action.payload);
    },
    resetMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { setMessages, addMessage, resetMessages } = convoSlice.actions;
export default convoSlice.reducer;
