import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { ApiService } from "@/services/apiService";
import { MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";

import { parseIntent } from "./useIntentParser";

/**
 * Custom hook to handle chat streaming via SSE (Server-Sent Events).
 * Manages incoming bot messages and updates the conversation state.
 */
export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { updateConvoMessages, convoMessages } = useConversation();
  const latestConvoRef = useRef(convoMessages);

  useEffect(() => {
    latestConvoRef.current = convoMessages;
  }, [convoMessages]);

  /**
   * Handles streaming chat responses from the bot.
   */
  return async (
    inputText: string,
    currentMessages: MessageType[],
    conversationId: string,
    enableSearch: boolean,
    pageFetchURL: string,
    botMessageId: string,
    botResponseText: string = "",
  ) => {
    /**
     * Builds a bot response object with optional overrides.
     */
    const buildBotResponse = (
      overrides: Partial<MessageType> = {},
    ): MessageType => ({
      type: "bot",
      message_id: botMessageId,
      response: botResponseText,
      searchWeb: enableSearch,
      pageFetchURL,
      date: fetchDate(),
      ...overrides,
    });

    /**
     * Handles incoming SSE messages and updates the bot's response in real time.
     */
    const onMessage = (event: EventSourceMessage) => {
      const dataJson = JSON.parse(event.data);

      if (dataJson.error) return toast.error(dataJson.error);

      botResponseText += dataJson.response || "\n";
      const currentConvo = latestConvoRef.current;

      const parsedIntent = parseIntent(dataJson);

      console.log("search results: ", parsedIntent.search_results);

      const botResponse = buildBotResponse({
        intent: parsedIntent.intent,
        calendar_options: parsedIntent.calendar_options,
        search_results: parsedIntent.search_results,
      });

      if (
        currentConvo.length > 0 &&
        currentConvo[currentConvo.length - 1].type === "bot"
      ) {
        const updatedMessages = [...currentConvo];
        updatedMessages[updatedMessages.length - 1] = botResponse;
        updateConvoMessages(updatedMessages);
      } else updateConvoMessages([...currentConvo, botResponse]);
    };

    /**
     * Handles the closing of the SSE connection.
     * Updates the conversation history in the backend.
     */
    const onClose = async () => {
      const finalizedBotResponse = buildBotResponse({ loading: false });
      const updatedMessages = [...currentMessages, finalizedBotResponse];
      await ApiService.updateConversation(conversationId, updatedMessages);
      setIsLoading(false);
    };

    /**
     * Handles errors from the SSE stream.
     */
    const onError = (err: any) => {
      setIsLoading(false);
      console.error("Error from server:", err);
      toast.error("Error fetching messages. Please try again later.");
    };

    // Initiate the SSE request to stream chat responses from the server.
    await ApiService.fetchChatStream(
      inputText,
      enableSearch,
      pageFetchURL,
      currentMessages,
      conversationId,
      onMessage,
      onClose,
      onError,
    );
  };
};
