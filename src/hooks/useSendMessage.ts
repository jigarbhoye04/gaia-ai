"use client";

import ObjectID from "bson-objectid";
import { useDispatch } from "react-redux";

import {
  FileData,
  SearchMode,
} from "@/components/Chat/SearchBar/MainSearchbar";
import { useChatStream } from "@/hooks/useChatStream";
import { addMessage } from "@/redux/slices/conversationSlice";
import { MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";


export const useSendMessage = (convoIdParam: string | null) => {
  const dispatch = useDispatch();
  const fetchChatStream = useChatStream();

  // returns as sendMessage hook
  return async (
    inputText: string,
    currentMode: SearchMode,
    pageFetchURLs: string[] = [],
    fileData: FileData[] = [], // Update parameter to accept FileData objects
  ) => {
    const enableSearch = currentMode === "web_search";
    const enableDeepSearch = currentMode === "deep_search";

    const botMessageId = String(ObjectID());

    // Extract just the file IDs for the message
    const fileIds = fileData.map((file) => file.fileId);

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

    // For new conversations, we'll let the backend create the conversation
    // No need to call createNewConversation explicitly
    const conversationId = convoIdParam || null;

    // If this is a new conversation (null conversationId),
    // the backend will create it and return the ID
    await fetchChatStream(
      inputText,
      [currentMessage],
      conversationId,
      enableSearch,
      enableDeepSearch,
      pageFetchURLs,
      botMessageId,
      fileData,
    );
  };
};
