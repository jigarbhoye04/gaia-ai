// useChatStream.ts
import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";
import { useConversation } from "@/hooks/useConversation";
import { useFetchConversations } from "@/hooks/useConversationList";
import { useLoading } from "@/hooks/useLoading";
import { ApiService } from "@/services/apiService";
import { MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";

import { useLoadingText } from "./useLoadingText";
import { parseStreamData } from "./useStreamDataParser";

export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { updateConvoMessages, convoMessages } = useConversation();
  const router = useRouter();
  const fetchConversations = useFetchConversations();
  const { setLoadingText, resetLoadingText } = useLoadingText();

  // Unified ref storage
  const refs = useRef({
    convoMessages: convoMessages,
    botMessage: null as MessageType | null,
    accumulatedResponse: "",
    userPrompt: "",
    newConversation: {
      id: null as string | null,
      description: null as string | null,
    },
  });

  useEffect(() => {
    refs.current.convoMessages = convoMessages;
  }, [convoMessages]);

  const updateBotMessage = (overrides: Partial<MessageType>) => {
    const baseMessage: MessageType = {
      type: "bot",
      message_id: refs.current.botMessage?.message_id || "",
      response: refs.current.accumulatedResponse,
      searchWeb: false,
      deepSearchWeb: false,
      date: fetchDate(),
      loading: true,
    };

    // Preserve existing data and merge with new overrides
    refs.current.botMessage = {
      ...baseMessage,
      ...refs.current.botMessage, // Keep existing data
      ...overrides, // Apply new updates
    };

    const currentConvo = [...refs.current.convoMessages];

    if (
      currentConvo.length > 0 &&
      currentConvo[currentConvo.length - 1].type === "bot"
    ) {
      currentConvo[currentConvo.length - 1] = refs.current.botMessage;
    } else {
      currentConvo.push(refs.current.botMessage);
    }

    updateConvoMessages(currentConvo);
  };

  const handleStreamEvent = (event: EventSourceMessage) => {
    if (event.data === "[DONE]") return;

    const data = JSON.parse(event.data);
    if (data.error) return toast.error(data.error);

    if (data.progress) setLoadingText(data.progress);
    if (data.conversation_id)
      refs.current.newConversation.id = data.conversation_id;
    if (data.conversation_description)
      refs.current.newConversation.description = data.conversation_description;

    if (data.status === "generating_image") {
      setLoadingText("Generating image...");
      updateBotMessage({
        image_data: { url: "", prompt: refs.current.userPrompt },
        response: "",
      });
      return;
    }

    if (data.intent === "generate_image" && data.image_data) {
      updateBotMessage({
        image_data: data.image_data,
        loading: false,
      });
      return;
    }

    // Add to the accumulated response if there's new response content
    if (data.response) {
      refs.current.accumulatedResponse += data.response;
    }

    // Parse only the data that's actually present in this stream chunk
    const streamUpdates = parseStreamData(data);

    // Keep the existing email_compose_data if we're not receiving a new one
    if (
      refs.current.botMessage?.email_compose_data &&
      !streamUpdates.email_compose_data
    ) {
      streamUpdates.email_compose_data =
        refs.current.botMessage.email_compose_data;
    }

    updateBotMessage({
      ...streamUpdates,
      response: refs.current.accumulatedResponse,
    });
  };

  const handleStreamClose = async () => {
    if (!refs.current.botMessage) return;

    // Preserve all existing data when marking as complete
    updateBotMessage({ 
      loading: false,
      // Explicitly preserve email_compose_data and other tool data
      ...(refs.current.botMessage.email_compose_data && {
        email_compose_data: refs.current.botMessage.email_compose_data
      }),
      ...(refs.current.botMessage.calendar_options && {
        calendar_options: refs.current.botMessage.calendar_options
      }),
      ...(refs.current.botMessage.weather_data && {
        weather_data: refs.current.botMessage.weather_data
      }),
      ...(refs.current.botMessage.search_results && {
        search_results: refs.current.botMessage.search_results
      }),
      ...(refs.current.botMessage.deep_search_results && {
        deep_search_results: refs.current.botMessage.deep_search_results
      }),
      ...(refs.current.botMessage.image_data && {
        image_data: refs.current.botMessage.image_data
      }),
      ...(refs.current.botMessage.intent && {
        intent: refs.current.botMessage.intent
      })
    });
    setIsLoading(false);
    resetLoadingText();

    if (refs.current.newConversation.id) {
      // && !refs.current.convoMessages[0]?.conversation_id
      router.push(`/c/${refs.current.newConversation.id}`);
      fetchConversations();
    }

    refs.current.botMessage = null;
    refs.current.newConversation = { id: null, description: null };
  };

  return async (
    inputText: string,
    currentMessages: MessageType[],
    conversationId: string | null,
    enableSearch: boolean,
    enableDeepSearch: boolean,
    pageFetchURLs: string[],
    botMessageId: string,
    fileData: FileData[] = [],
  ) => {
    refs.current.accumulatedResponse = "";
    refs.current.userPrompt = inputText;
    refs.current.botMessage = {
      type: "bot",
      message_id: botMessageId,
      response: "",
      searchWeb: enableSearch,
      deepSearchWeb: enableDeepSearch,
      pageFetchURLs,
      date: fetchDate(),
      loading: true,
      fileIds: fileData.map((f) => f.fileId),
      fileData,
    };

    await ApiService.fetchChatStream(
      inputText,
      enableSearch,
      enableDeepSearch,
      pageFetchURLs,
      [...refs.current.convoMessages, ...currentMessages],
      conversationId,
      handleStreamEvent,
      handleStreamClose,
      (err) => {
        setIsLoading(false);
        resetLoadingText();
        toast.error("Error fetching messages. Please try again later.");
        console.error("Stream error:", err);
      },
      fileData,
    );
  };
};
