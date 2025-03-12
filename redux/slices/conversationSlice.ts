"use client";

import { MessageType } from "@/types/convoTypes";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ConversationState {
  messages: MessageType[];
}

const initialState: ConversationState = {
  messages: [],
};

const conversationSlice = createSlice({
  name: "conversation",
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

export const { setMessages, addMessage, resetMessages } =
  conversationSlice.actions;
export default conversationSlice.reducer;
