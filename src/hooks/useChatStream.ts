import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";
import { useConversation } from "@/hooks/useConversation";
import { useLoading } from "@/hooks/useLoading";
import { useFetchConversations } from "@/hooks/useConversationList";
import { ApiService } from "@/services/apiService";
import { ImageData, MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";

import { parseIntent } from "./useIntentParser";
import { useLoadingText } from "./useLoadingText";

/**
 * Custom hook to handle chat streaming via SSE (Server-Sent Events).
 * Manages incoming bot messages and updates the conversation state.
 */
export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { updateConvoMessages, convoMessages } = useConversation();
  const router = useRouter();
  const fetchConversations = useFetchConversations();
  const latestConvoRef = useRef(convoMessages);
  const botMessageRef = useRef<MessageType | null>(null);
  const accumulatedResponseRef = useRef<string>("");
  const userPromptRef = useRef<string>("");
  const { setLoadingText, resetLoadingText } = useLoadingText();
  const newConversationIdRef = useRef<string | null>(null);
  const newConversationDescriptionRef = useRef<string | null>(null);

  useEffect(() => {
    latestConvoRef.current = convoMessages;
  }, [convoMessages]);

  /**
   * Handles streaming chat responses from the bot.
   */
  return async (
    inputText: string,
    currentMessages: MessageType[],
    conversationId: string | null,
    enableSearch: boolean,
    enableDeepSearch: boolean,
    pageFetchURLs: string[],
    botMessageId: string,
    fileData: FileData[] = [], // Updated to accept FileData instead of fileIds
  ) => {
    accumulatedResponseRef.current = "";
    userPromptRef.current = inputText;

    // Extract fileIds from fileData for backward compatibility
    const fileIds = fileData.map((file) => file.fileId);

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

      // Check for newly created conversation info from the backend
      if (!conversationId) {
        // Store the newly created conversation ID
        if (dataJson.conversation_id) newConversationIdRef.current = dataJson.conversation_id;


        // Store the conversation description that comes from the backend
        if (dataJson.conversation_description) newConversationDescriptionRef.current = dataJson.conversation_description;

      }

      if (dataJson.status === "generating_image") {
        setLoadingText("Generating image...");

        // Create initial image data object
        const initialImageData: ImageData = {
          url: "", // Will be filled later
          prompt: userPromptRef.current,
        };

        botMessageRef.current = buildBotResponse({
          response: "",
          loading: true,
          image_data: initialImageData,
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
          image_data: dataJson.image_data,
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

      // Create a new bot response that preserves existing intent data
      botMessageRef.current = buildBotResponse({
        intent: parsedIntent.intent || botMessageRef.current?.intent,
        // Preserve special data once it's available
        calendar_options:
          parsedIntent.calendar_options ||
          botMessageRef.current?.calendar_options ||
          null,
        weather_data:
          parsedIntent.weather_data ||
          botMessageRef.current?.weather_data ||
          null,
        search_results:
          parsedIntent.search_results ||
          botMessageRef.current?.search_results ||
          null,
        deep_search_results:
          parsedIntent.deep_search_results ||
          botMessageRef.current?.deep_search_results ||
          null,
        image_data:
          parsedIntent.image_data || botMessageRef.current?.image_data || null,
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
      // Clear weather_data if the final intent is not weather
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

      updateConvoMessages(finalMessages);

      // Handle URL navigation for new conversations after the messages are done streaming
      if (newConversationIdRef.current && !conversationId) {
        // Navigate to the newly created conversation
        router.push(`/c/${newConversationIdRef.current}`);

        // If backend provided a description, use it directly
        // No need to make an additional API call for description
        if (newConversationIdRef.current) {
          // Instead of making a new API call, just trigger a fetch of the conversations list
          // to update the sidebar with the new conversation and its description
          fetchConversations();
        }
      }

      const messagesForUpdate: MessageType[] = [];

      const userMessageIndex = finalMessages.length - 2;
      if (
        userMessageIndex >= 0 &&
        finalMessages[userMessageIndex].type === "user"
      ) {
        messagesForUpdate.push(finalMessages[userMessageIndex]);
      }

      messagesForUpdate.push(finalBotMessage);

      try {
        // Use the new conversation ID if one was returned from the backend
        const finalConversationId = newConversationIdRef.current || conversationId;
        if (finalConversationId) {
          await ApiService.updateConversation(finalConversationId, messagesForUpdate);
        }
      } catch (error) {
        console.error("Failed to save conversation:", error);
        toast.error(
          "Failed to save the conversation. Some messages might not be preserved.",
        );
      } finally {
        setIsLoading(false);
        resetLoadingText();
        botMessageRef.current = null;
        newConversationIdRef.current = null;
        newConversationDescriptionRef.current = null;
      }
    };

    /**
     * Handles errors from the SSE stream.
     */
    const onError = (err: unknown) => {
      setIsLoading(false);
      resetLoadingText();
      console.error("Error from server:", err);
      toast.error("Error fetching messages. Please try again later.");
    };

    // Initiate the SSE request to stream chat responses from the server.
    await ApiService.fetchChatStream(
      inputText,
      enableSearch,
      enableDeepSearch,
      pageFetchURLs,
      [...latestConvoRef.current, ...currentMessages],
      conversationId,
      onMessage,
      onClose,
      onError,
      fileData,
    );
  };
};
