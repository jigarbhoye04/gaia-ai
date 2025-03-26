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
import { SearchMode } from "@/components/Chat/SearchBar/MainSearchbar";

export const useSendMessage = (convoIdParam: string | null) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setIsLoading } = useLoading();
  const fetchChatStream = useChatStream();
  const fetchConversations = useFetchConversations();

  // returns as sendMessage hook
  return async (
    inputText: string,
    currentMode: SearchMode,
    pageFetchURLs: string[] = [],
    fileIds: string[] = []
  ) => {

    const enableSearch = currentMode === "web_search"
    const enableDeepSearch = currentMode === "deep_search"

    const botMessageId = String(ObjectID());

    const currentMessage: MessageType = {
      type: "user",
      response: inputText,
      searchWeb: enableSearch,
      deepSearchWeb: enableDeepSearch,
      pageFetchURLs,
      date: fetchDate(),
      message_id: String(ObjectID()),
      fileIds: fileIds.length > 0 ? fileIds : undefined, // Include file IDs if provided
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
      enableDeepSearch,
      pageFetchURLs,
      botMessageId,
      fileIds // Pass file IDs to chat stream
    );
  };
};
