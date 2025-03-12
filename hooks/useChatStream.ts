import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { ApiService } from "@/services/apiService";
import { IntentType, MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";
import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { toast } from "sonner";
import { useIntentParser } from "./useIntentParser";

/**
 * Custom hook to handle chat streaming via SSE (Server-Sent Events).
 * Manages incoming bot messages and updates the conversation state.
 */
export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { appendBotMessage, updateConvoMessages } = useConversation();
  const { finalIntent, parseIntent } = useIntentParser();

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
     *
     * @param {EventSourceMessage} event - The incoming event message.
     */
    const onMessage = (event: EventSourceMessage) => {
      const dataJson = JSON.parse(event.data);

      if (dataJson.error) return toast.error(dataJson.error);

      botResponseText += dataJson.response || "\n";
      parseIntent(dataJson);
      // appendBotMessage(
      //   buildBotResponse(),
      //   finalIntent,
      //   botResponseText,
      //   currentMessages
      // );

      // const botResponse = buildBotResponse();

      updateConvoMessages((messages = []) => {
        const lastIndex = messages.length - 1;

        // If no messages exist, initialize with user message and bot response
        if (lastIndex < 0) return [...currentMessages, buildBotResponse()];

        return [...messages, buildBotResponse()];
      });
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
