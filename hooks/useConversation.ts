import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { MessageType } from "@/types/convoTypes";
import {
  addMessage,
  resetMessages,
  setMessages,
} from "@/redux/slices/conversationSlice";

export const useConversation = () => {
  const dispatch: AppDispatch = useDispatch();
  const convoMessages = useSelector(
    (state: RootState) => state.conversation.messages
  );

  const updateConvoMessages = (
    updater: MessageType[] | ((oldMessages: MessageType[]) => MessageType[])
  ): void => {
    dispatch(
      setMessages(
        typeof updater === "function" ? updater(convoMessages) : updater
      )
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
  };
};
