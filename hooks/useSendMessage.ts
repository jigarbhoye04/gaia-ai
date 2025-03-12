"use client";

import { useConversationList } from "@/contexts/ConversationList";
import { addMessage } from "@/redux/slices/conversationSlice";
import { useChatStream } from "@/services/useChatStream";
import { MessageType } from "@/types/convoTypes";
import { createNewConversation } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";
import ObjectID from "bson-objectid";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useLoading } from "./useLoading";

export const useSendMessage = (convoIdParam: string | null) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setIsLoading } = useLoading();
  const fetchChatStream = useChatStream();
  const { fetchConversations } = useConversationList();

  // returns as sendMessage hook
  return async (
    inputText: string,
    enableSearch: boolean = false,
    pageFetchURL: string
  ) => {
    const bot_message_id = String(ObjectID());

    const currentMessages: MessageType[] = [
      {
        type: "user",
        response: inputText,
        searchWeb: enableSearch,
        pageFetchURL,
        date: fetchDate(),
        message_id: String(ObjectID()),
      },
      {
        searchWeb: enableSearch,
        pageFetchURL,
        type: "bot",
        response: "",
        message_id: bot_message_id,
        date: fetchDate(),
      },
    ];

    // Add messages to Redux store
    currentMessages.forEach((message) => {
      dispatch(addMessage(message));
    });

    // If no existing conversation, create a new one.
    const conversationId =
      convoIdParam ||
      (await createNewConversation(
        currentMessages,
        router,
        fetchConversations
      ));

    if (!conversationId) return setIsLoading(false);

    // Start fetching bot response stream.
    await fetchChatStream(
      inputText,
      currentMessages,
      conversationId,
      enableSearch,
      pageFetchURL,
      bot_message_id
    );
  };
};
