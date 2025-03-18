"use client";

import ObjectID from "bson-objectid";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import { useChatStream } from "@/hooks/useChatStream";
import { useFetchConversations } from "@/hooks/useConversationList";
import { addMessage } from "@/redux/slices/conversationSlice";
import { MessageType } from "@/types/convoTypes";
import { createNewConversation } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";

import { useLoading } from "./useLoading";

export const useSendMessage = (convoIdParam: string | null) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setIsLoading } = useLoading();
  const fetchChatStream = useChatStream();
  const fetchConversations = useFetchConversations();

  // returns as sendMessage hook
  return async (
    inputText: string,
    enableSearch: boolean = false,
    pageFetchURL: string,
  ) => {
    const botMessageId = String(ObjectID());

    const currentMessage: MessageType = {
      type: "user",
      response: inputText,
      searchWeb: enableSearch,
      pageFetchURL,
      date: fetchDate(),
      message_id: String(ObjectID()),
    };

    dispatch(addMessage(currentMessage));

    const conversationId =
      convoIdParam ||
      (await createNewConversation(
        [currentMessage],
        router,
        fetchConversations,
      ));

    if (!conversationId) return setIsLoading(false);

    await fetchChatStream(
      inputText,
      [currentMessage],
      conversationId,
      enableSearch,
      pageFetchURL,
      botMessageId,
    );
  };
};
