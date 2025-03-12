import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { ApiService } from "@/services/apiService";
import { IntentType, MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";
import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import { useIntentParser } from "./useIntentParser";
import { useEffect, useRef } from "react";

/**
 * Custom hook to handle chat streaming via SSE (Server-Sent Events).
 * Manages incoming bot messages and updates the conversation state.
 */
export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { updateConvoMessages, convoMessages } = useConversation();
  const { finalIntent, parseIntent } = useIntentParser();
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
    botResponseText: string = ""
  ) => {
    /**
     * Builds a bot response object with optional overrides.
     */
    const buildBotResponse = (
      overrides: Partial<MessageType> = {}
    ): MessageType => ({
      type: "bot",
      message_id: botMessageId,
      response: botResponseText,
      searchWeb: enableSearch,
      pageFetchURL,
      date: fetchDate(),
      intent: finalIntent.intent,
      calendar_options: finalIntent.calendar_options,
      ...overrides,
    });

    /**
     * Handles incoming SSE messages and updates the bot's response in real time.
     */
    const onMessage = (event: EventSourceMessage) => {
      const dataJson = JSON.parse(event.data);

      if (dataJson.error) return toast.error(dataJson.error);

      botResponseText += dataJson.response || "\n";
      parseIntent(dataJson);

      const currentConvo = latestConvoRef.current;

      if (
        currentConvo.length > 0 &&
        currentConvo[currentConvo.length - 1].type === "bot"
      ) {
        const updatedMessages = [...currentConvo];
        updatedMessages[updatedMessages.length - 1] = buildBotResponse();
        updateConvoMessages(updatedMessages);
      } else {
        updateConvoMessages([...currentConvo, buildBotResponse()]);
      }

      // updateConvoMessages((messages = []) => {
      //   // If no messages exist, initialize with user message and bot response
      //   if (messages.length == 0)
      //     return [...currentMessages, buildBotResponse()];

      //   return [...messages, buildBotResponse()];
      // });
    };

    /**
     * Handles the closing of the SSE connection.
     * Updates the conversation history in the backend.
     */
    const onClose = async () => {
      const finalizedBotResponse = buildBotResponse({ loading: false });

      // Clone the current messages array and replace the last message with the finalized bot response.
      // const updatedMessages = [...currentMessages];
      currentMessages[currentMessages.length - 1] = finalizedBotResponse;

      await ApiService.updateConversation(conversationId, currentMessages);
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
      onError
    );
  };
};
