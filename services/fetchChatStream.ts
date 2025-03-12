// import { useChatStream } from "@/services/fetchChatStream";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useLoading } from "@/contexts/LoadingContext";
import { ApiService } from "@/services/apiService";
import { CalendarOptions, MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";
import { EventSourceMessage } from "@microsoft/fetch-event-source";
import { toast } from "sonner";

export const useChatStream = () => {
  const { setIsLoading } = useLoading();
  const { convoMessages, setConvoMessages } = useConvo();

  return async (
    inputText: string,
    currentMessages: MessageType[],
    conversationId: string,
    enableSearch: boolean,
    pageFetchURL: string,
    bot_message_id: string
  ) => {
    let botResponseText = "";

    // Initialize finalIntent with calendar_options as null.
    let finalIntent: {
      intent: string | undefined;
      calendar_options?: CalendarOptions[] | null;
    } = {
      intent: undefined,
      calendar_options: null,
    };

    //   setLoading(true);

    const onMessage = (event: EventSourceMessage) => {
      const dataJson = JSON.parse(event.data);

      if (dataJson.error) toast.error(dataJson.error);

      const intent = dataJson?.intent;
      const calendar_options = dataJson?.calendar_options;
      const response = dataJson.response || "\n";

      botResponseText += response;

      if (dataJson.intent) {
        // Ensure calendar_options is always an array
        let options = calendar_options || null;
        if (options && !Array.isArray(options)) {
          options = [options];
        }
        finalIntent = {
          intent,
          calendar_options: options,
        };
      }

      const botResponse: MessageType = {
        type: "bot",
        message_id: bot_message_id,
        response: botResponseText,
        searchWeb: enableSearch,
        pageFetchURL,
        date: fetchDate(),
        intent: finalIntent.intent,
        calendar_options: finalIntent.calendar_options, // Always an array or null
      };

      setConvoMessages((oldMessages = []) => {
        // If there are no messages yet, start the conversation with the user message followed by the bot response
        if (oldMessages.length === 0) return [currentMessages[0], botResponse];

        // If the last message was a user message, append the bot response to it
        const lastMessage = oldMessages[oldMessages.length - 1];
        if (lastMessage.type === "user") return [...oldMessages, botResponse];

        return [
          ...oldMessages.slice(0, -1),
          {
            ...lastMessage,
            response: botResponseText,
            intent: finalIntent.intent,
            calendar_options: finalIntent.calendar_options,
          },
        ] as MessageType[];
      });
    };

    const onClose = async () => {
      const finalizedBotResponse: MessageType = {
        type: "bot",
        response: botResponseText,
        date: fetchDate(),
        loading: false,
        searchWeb: enableSearch,
        pageFetchURL,
        message_id: bot_message_id,
        intent: finalIntent.intent,
        calendar_options: finalIntent.calendar_options, // remains an array (or null)
      };

      currentMessages[currentMessages.length - 1] = finalizedBotResponse;

      try {
        await ApiService.updateConversation(conversationId, currentMessages);
      } catch (err) {
        console.error("Failed to update conversation:", err);
      } finally {
        //   setLoading(false);
        setIsLoading(false);
      }
    };

    const onError = (err: any) => {
      console.error("Error from server:", err);
      // setLoading(false);
    };

    await ApiService.fetchChatStream(
      inputText,
      enableSearch,
      pageFetchURL,
      convoMessages,
      conversationId,
      onMessage,
      onClose,
      onError
    );
  };
};
