import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source";
import { toast } from "sonner";

import { useConversation } from "@/hooks/useConversation";
import { MessageType } from "@/types/convoTypes";
import { apiauth } from "@/utils/apiaxios";

export const ApiService = {
  fetchMessages: async (conversationId: string) => {
    try {
      const response = await apiauth.get(`/conversations/${conversationId}`);
      return response?.data?.messages;
    } catch (error) {
      console.error(
        `Error fetching messages for conversation ${conversationId}:`,
        error,
      );
      toast.error("Error fetching messages. Please try again later.");
      throw error;
    }
  },

  createConversation: async (convoID: string) => {
    try {
      await apiauth.post("/conversations", {
        conversation_id: convoID,
      });
    } catch (error) {
      console.error(`Error creating conversation with id ${convoID}:`, error);
      toast.error("Error creating conversation. Please try again later.");
      throw error;
    }
  },

  deleteAllConversations: async () => {
    try {
      await apiauth.delete(`/conversations`);
    } catch (error) {
      console.error("Error deleting all conversations:", error);
      toast.error("Error deleting conversations. Please try again later.");
      throw error;
    }
  },

  updateConversation: async (
    conversationId: string,
    messages: MessageType[],
  ) => {
    try {
      // if (messages.length > 1) {
      await apiauth.put(`/conversations/${conversationId}/messages`, {
        conversation_id: conversationId,
        messages,
      });
      // }
    } catch (error) {
      console.error(`Error updating conversation ${conversationId}:`, error);
      toast.error("Error updating conversation. Please try again later.");
      throw error;
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
    onError: (err: any) => void,
  ) => {
    const controller = new AbortController();

    await fetchEventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}chat-stream`,
      {
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
            .map(({ type, response }, _index, _array) => ({
              role: type === "bot" ? "assistant" : type,
              content: response,
            })),
        }),
        onmessage(event) {
          if (event.data === "[DONE]") {
            onClose();
            controller.abort();
            return;
          }

          onMessage(event);
        },
        onclose: onClose,
        onerror: onError,
      },
    );
  },

  updateConversationDescription: async (
    conversationId: string,
    userFirstMessage: string,
    fetchConversations: () => void,
    llm: boolean = true,
  ) => {
    const response = await apiauth.put(
      `/conversations/${conversationId}/description${llm ? "/llm" : ""}`,
      {
        userFirstMessage,
      },
    );

    // To update in the sidebar
    fetchConversations();

    return response.data;
  },
};
