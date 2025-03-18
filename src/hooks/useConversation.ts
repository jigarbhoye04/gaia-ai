import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  resetMessages,
  setMessages,
} from "@/redux/slices/conversationSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { MessageType } from "@/types/convoTypes";

export const useConversation = () => {
  const dispatch: AppDispatch = useDispatch();
  const convoMessages = useSelector(
    (state: RootState) => state.conversation.messages,
  );

  const appendBotMessage = (
    botResponse: MessageType,
    finalIntent: any,
    botResponseText: string,
    currentMessages: MessageType[],
  ): void => {
    updateConvoMessages((oldMessages = []) => {
      // If there are no messages yet, start the conversation with the user message followed by the bot response
      if (oldMessages.length === 0) return [currentMessages[0], botResponse];

      // If the last message was a user message, append the bot response to it
      const lastMessage = oldMessages[oldMessages.length - 1];
      if (lastMessage.type === "user") return [...oldMessages, botResponse];

      return [
        ...oldMessages.slice(0, -1),
        {
          ...lastMessage,
          response: botResponseText,
          intent: finalIntent.intent,
          calendar_options: finalIntent.calendar_options,
        },
      ] as MessageType[];
    });
  };

  const updateConvoMessages = (
    updater: MessageType[] | ((oldMessages: MessageType[]) => MessageType[]),
  ): void => {
    dispatch(
      setMessages(
        typeof updater === "function" ? updater(convoMessages) : updater,
      ),
    );
  };

  const appendMessage = (msg: MessageType): void => {
    dispatch(addMessage(msg));
  };

  const clearMessages = (): void => {
    dispatch(resetMessages());
  };

  return {
    convoMessages,
    updateConvoMessages,
    appendMessage,
    clearMessages,
    appendBotMessage,
  };
};
