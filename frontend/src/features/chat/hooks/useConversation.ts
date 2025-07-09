import { useDispatch, useSelector } from "react-redux";

import { resetMessages, setMessages } from "@/redux/slices/conversationSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { MessageType } from "@/types/features/convoTypes";

export const useConversation = () => {
  const dispatch: AppDispatch = useDispatch();
  const convoMessages = useSelector(
    (state: RootState) => state.conversation.messages,
  );

  const updateConvoMessages = (
    updater: MessageType[] | ((oldMessages: MessageType[]) => MessageType[]),
  ): void => {
    dispatch(
      setMessages(
        typeof updater === "function" ? updater(convoMessages) : updater,
      ),
    );
  };

  const clearMessages = (): void => {
    dispatch(resetMessages());
  };

  return {
    convoMessages,
    updateConvoMessages,
    clearMessages,
  };
};
