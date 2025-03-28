"use client";

import ObjectID from "bson-objectid";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import { FileData, SearchMode } from "@/components/Chat/SearchBar/MainSearchbar";
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
    currentMode: SearchMode,
    pageFetchURLs: string[] = [],
    fileData: FileData[] = [] // Update parameter to accept FileData objects
  ) => {

    const enableSearch = currentMode === "web_search"
    const enableDeepSearch = currentMode === "deep_search"

    const botMessageId = String(ObjectID());

    // Extract just the file IDs for the message
    const fileIds = fileData.map(file => file.fileId);

    const currentMessage: MessageType = {
      type: "user",
      response: inputText,
      searchWeb: enableSearch,
      deepSearchWeb: enableDeepSearch,
      pageFetchURLs,
      date: fetchDate(),
      message_id: String(ObjectID()),
      fileIds: fileIds.length > 0 ? fileIds : undefined, // Include file IDs if provided
      fileData: fileData.length > 0 ? fileData : undefined, // Store the complete file data
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
      fileData // Pass complete file data to chat stream
    );
  };
};
