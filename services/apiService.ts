import { useConversation } from "@/hooks/useConversation";
import { MessageType } from "@/types/convoTypes";
import { apiauth } from "@/utils/apiaxios";
import {
  EventSourceMessage,
  fetchEventSource,
} from "@microsoft/fetch-event-source";

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

  // await ApiService.fetchChatStream(
  //     inputText,
  //     enableSearch,
  //     pageFetchURL,
  //     convoMessages,
  //     conversationId,
  //     appendMessage,
  //     onMessage,
  //     onClose,
  //     onError
  //   );

  fetchChatStream: async (
    inputText: string,
    enableSearch: boolean,
    pageFetchURL: string,
    convoMessages: MessageType[],
    conversationId: string,
    // appendMessage: (msg: MessageType) => void,
    onMessage: (event: EventSourceMessage) => void,
    onClose: () => void,
    onError: (err: any) => void
  ) => {
    // appendMessage({
    //   type: "user",
    //   response: inputText,
    //   message_id: "",
    // });

    const controller = new AbortController();

    console.log(convoMessages, "convoMessages test 2");

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
      }
    );
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
