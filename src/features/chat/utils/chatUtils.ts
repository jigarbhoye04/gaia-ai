import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { Dispatch, SetStateAction } from "react";

import { chatApi } from "@/features/chat/api/chatApi";
import { MessageType } from "@/types/features/convoTypes";

export const fetchMessages = async (
  conversationId: string,
  setConvoMessages: Dispatch<SetStateAction<MessageType[]>>,
  router: AppRouterInstance | string[],
) => {
  try {
    if (!conversationId) return;
    const messages = await chatApi.fetchMessages(conversationId);
    if (messages && messages.length > 1) setConvoMessages(messages);
  } catch (e) {
    console.error("Failed to fetch messages:", e);
    router.push("/c");
  }
};
