import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Dispatch, SetStateAction } from "react";
import { v1 as uuidv1 } from "uuid";

import { ApiService } from "@/services/apiService";
import { MessageType } from "@/types/convoTypes";
import { apiauth } from "@/utils/apiaxios";

export const fetchConversationDescription = async (
  searchbarText: string,
): Promise<string> => {
  const response = await apiauth.post(
    "/chat",
    {
      message: `Summarise what the message/question '${searchbarText}' is about, in under 3-4 words from a 3rd person perspective. Just respond with the summary. Exclude any double quotes or titles.`,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response?.data?.response?.toString().replace('"', "") || "New Chat";
};

export const fetchMessages = async (
  conversationId: string,
  setConvoMessages: Dispatch<SetStateAction<MessageType[]>>,
  router: AppRouterInstance | string[],
) => {
  try {
    if (!conversationId) return;
    const messages = await ApiService.fetchMessages(conversationId);
    if (messages.length > 1) setConvoMessages(messages);
  } catch (e) {
    console.error("Failed to fetch messages:", e);
    router.push("/c");
  }
};

export const createNewConversation = async (
  currentMessages: MessageType[],
  router: string[] | AppRouterInstance,
  fetchConversations: () => void,
) => {
  try {
    const conversationId = uuidv1();

    await ApiService.createConversation(conversationId);

    ApiService.updateConversationDescription(
      conversationId,
      JSON.stringify(currentMessages[0]?.response || currentMessages[0]),
      fetchConversations,
    );

    router.push(`/c/${conversationId}`);

    return conversationId;
  } catch (err) {
    console.error("Failed to create conversation:", err);

    return null;
  }
};
