import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { ApiService } from "@/services/apiService";
import { MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";

import { parseIntent } from "./useIntentParser";
import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";

/**
 * Custom hook to handle chat streaming via SSE (Server-Sent Events).
 * Manages incoming bot messages and updates the conversation state.
 */
export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { updateConvoMessages, convoMessages } = useConversation();
  const latestConvoRef = useRef(convoMessages);
  const botMessageRef = useRef<MessageType | null>(null);
  const accumulatedResponseRef = useRef<string>("");
  const userPromptRef = useRef<string>("");

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
    enableDeepSearch: boolean,
    pageFetchURLs: string[],
    botMessageId: string,
    fileData: FileData[] = [] // Updated to accept FileData instead of fileIds
  ) => {
    accumulatedResponseRef.current = "";
    userPromptRef.current = inputText;

    // Extract fileIds from fileData for backward compatibility
    const fileIds = fileData.map(file => file.fileId);

    /**
     * Builds a bot response object with optional overrides.
     */
    const buildBotResponse = (
      overrides: Partial<MessageType> = {},
    ): MessageType => ({
      type: "bot",
      message_id: botMessageId,
      response: accumulatedResponseRef.current,
      searchWeb: enableSearch,
      deepSearchWeb: enableDeepSearch,
      pageFetchURLs,
      date: fetchDate(),
      loading: true,
      fileIds: fileIds.length > 0 ? fileIds : undefined,
      fileData: fileData.length > 0 ? fileData : undefined,
      ...overrides,
    });

    /**
     * Handles incoming SSE messages and updates the bot's response in real time.
     */
    const onMessage = (event: EventSourceMessage) => {
      if (event.data === "[DONE]") return;

      const dataJson = JSON.parse(event.data);
      if (dataJson.error) return toast.error(dataJson.error);

      if (dataJson.status === "generate_image") {
        botMessageRef.current = buildBotResponse({
          response: "",
          isImage: true,
          imagePrompt: userPromptRef.current,
          loading: true,
        });

        const currentConvo = latestConvoRef.current;
        if (
          currentConvo.length > 0 &&
          currentConvo[currentConvo.length - 1].type === "bot"
        ) {
          const updatedMessages = [...currentConvo];
          updatedMessages[updatedMessages.length - 1] = botMessageRef.current;
          updateConvoMessages(updatedMessages);
        } else updateConvoMessages([...currentConvo, botMessageRef.current]);

        return;
      }

      // Handle image generation result
      if (dataJson.intent === "generate_image" && dataJson.image_data) {
        botMessageRef.current = buildBotResponse({
          response: "Here is your generated image",
          imageUrl: dataJson.image_data.url,
          imagePrompt: userPromptRef.current,
          improvedImagePrompt: dataJson.image_data.improved_prompt,
          isImage: true,
          loading: false,
        });

        const currentConvo = latestConvoRef.current;
        if (
          currentConvo.length > 0 &&
          currentConvo[currentConvo.length - 1].type === "bot"
        ) {
          const updatedMessages = [...currentConvo];
          updatedMessages[updatedMessages.length - 1] = botMessageRef.current;
          updateConvoMessages(updatedMessages);
        } else {
          updateConvoMessages([...currentConvo, botMessageRef.current]);
        }
        return;
      }

      // Handle regular text responses
      accumulatedResponseRef.current += dataJson.response || "\n";
      const currentConvo = latestConvoRef.current;
      const parsedIntent = parseIntent(dataJson);
      botMessageRef.current = buildBotResponse({
        intent: parsedIntent.intent,
        calendar_options: parsedIntent.calendar_options,
        search_results: parsedIntent.search_results,
        deep_search_results: parsedIntent.deep_search_results,
      });
      // Always ensure we have the most recent messages
      if (
        currentConvo.length > 0 &&
        currentConvo[currentConvo.length - 1].type === "bot"
      ) {
        const updatedMessages = [...currentConvo];
        updatedMessages[updatedMessages.length - 1] = botMessageRef.current;
        updateConvoMessages(updatedMessages);
      } else {
        updateConvoMessages([...currentConvo, botMessageRef.current]);
      }
    };

    /**
     * Handles the closing of the SSE connection.
     * Updates the conversation history in the backend with final message state.
     */
    const onClose = async () => {
      if (!botMessageRef?.current) return;

      // Finalize the bot message by setting loading to false
      const finalBotMessage = {
        ...botMessageRef.current,
        loading: false,
      };

      // Get the current conversation state
      const currentConvo = latestConvoRef.current;
      let finalMessages: MessageType[];

      if (
        currentConvo.length >= 2 &&
        currentConvo[currentConvo.length - 1].type === "bot"
      ) {
        // If we have a bot message as the last message, update it
        finalMessages = [...currentConvo.slice(0, -1), finalBotMessage];
      } else {
        // Otherwise append the bot message
        finalMessages = [...currentConvo, finalBotMessage];
      }

      // Update UI
      updateConvoMessages(finalMessages);

      // Save to database
      try {
        await ApiService.updateConversation(conversationId, finalMessages);
      } catch (error) {
        console.error("Failed to save conversation:", error);
        toast.error(
          "Failed to save the conversation. Some messages might not be preserved.",
        );
      }

      setIsLoading(false);
    };

    /**
     * Handles errors from the SSE stream.
     */
    const onError = (err: unknown) => {
      setIsLoading(false);
      console.error("Error from server:", err);
      toast.error("Error fetching messages. Please try again later.");
    };

    // Initiate the SSE request to stream chat responses from the server.
    await ApiService.fetchChatStream(
      inputText,
      enableSearch,
      enableDeepSearch,
      pageFetchURLs,
      currentMessages,
      conversationId,
      onMessage,
      onClose,
      onError,
      fileData // Pass the complete fileData to the API service
    );
  };
};
