// utils/chatUtils.ts

import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

import { apiauth } from "@/utils/apiaxios";
import { MessageType } from "@/types/convoTypes";

export const fetchConversationDescription = async (
  searchbarText: string
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
    }
  );

  return response?.data?.response?.toString().replace('"', "") || "New Chat";
};

export const ApiService = {
  fetchMessages: async (conversationId: string) => {
    const response = await apiauth.get(`/conversations/${conversationId}`);

    return response?.data?.messages;
  },

  createConversation: async (convoID: string) => {
    await apiauth.post("/conversations", {
      conversation_id: convoID,
    });
  },

  deleteAllConversations: async () => {
    await apiauth.delete(`/conversations`);
  },

  updateConversation: async (
    conversationId: string,
    messages: MessageType[]
  ) => {
    if (messages.length > 1) {
      await apiauth.put(`/conversations/${conversationId}/messages`, {
        conversation_id: conversationId,
        messages,
      });
    }
  },

  fetchChatStream: async (
    inputText: string,
    enableSearch: boolean,
    pageFetchURL: string,
    convoMessages: MessageType[],
    conversationId: string,
    onMessage: (event: EventSourceMessage) => void,
    onClose: () => void,
    onError: (err: any) => void
  ) => {
    convoMessages.push({
      type: "user",
      response: inputText,
      message_id: "",
    });

    const controller = new AbortController();

    await fetchEventSource(`${process.env.BACKEND_URL}chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify({
        conversation_id: conversationId,
        message: inputText,
        search_web: enableSearch || false,
        pageFetchURL,
        messages: convoMessages
          .slice(-10)
          .filter(({ response }) => response.trim().length > 0)
          // .filter(({ type }) => type == "user")
          .map(({ type, response }, _index, _array) => ({
            role: type === "bot" ? "assistant" : type,
            // role: type,
            // content: `mostRecent: ${index === array.length - 1}. ${response}`,
            content: response,
          })),
      }),
      onmessage(event) {
        console.log(event.data);

        if (event.data === "[DONE]") {
          onClose();
          controller.abort();

          return;
        }

        onMessage(event);
      },
      onclose: onClose,
      onerror: onError,
    });
  },

  updateConversationDescription: async (
    conversationId: string,
    userFirstMessage: string,
    fetchConversations: () => void,
    llm: boolean = true
  ) => {
    const response = await apiauth.put(
      `/conversations/${conversationId}/description${llm ? "/llm" : ""}`,
      {
        userFirstMessage,
      }
    );

    fetchConversations();

    return response.data;
  },
};
