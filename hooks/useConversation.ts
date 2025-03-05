import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { v1 as uuidv1 } from "uuid";
import ObjectID from "bson-objectid";
import { EventSourceMessage } from "@microsoft/fetch-event-source";

import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useLoading } from "@/contexts/LoadingContext";
import { CalendarOptions, MessageType } from "@/types/convoTypes";
import { ApiService } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";
import { toast } from "sonner";

export const useConversation = (convoIdParam: string | null) => {
  const { setIsLoading } = useLoading();
  const router = useRouter();
  const { convoMessages, setConvoMessages } = useConvo();
  const { fetchConversations } = useConversationList();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    convoIdParam ? fetchMessages(convoIdParam) : router.push("/c");
  }, [convoIdParam]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const messages = await ApiService.fetchMessages(conversationId);

      if (messages.length > 1) setConvoMessages(messages);
    } catch (e) {
      console.error("Failed to fetch messages:", e);
      router.push("/c");
    }
  };

  const createNewConversation = async (currentMessages: MessageType[]) => {
    try {
      const conversationId = uuidv1();

      await ApiService.createConversation(conversationId);

      setTimeout(() => {
        ApiService.updateConversationDescription(
          conversationId,
          JSON.stringify(currentMessages[0]?.response || currentMessages[0]),
          fetchConversations
        );
      }, 1000);

      router.push(`/c/${conversationId}`);

      return conversationId;
    } catch (err) {
      console.error("Failed to create conversation:", err);

      return null;
    }
  };

  const fetchChatStream = async (
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

    setLoading(true);

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
        setLoading(false);
        setIsLoading(false);
      }
    };

    const onError = (err: any) => {
      console.error("Error from server:", err);
      setLoading(false);
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

  const updateConversation = async (
    inputText: string,
    enableSearch: boolean = false,
    pageFetchURL: string
  ) => {
    const bot_message_id = String(ObjectID());

    const currentMessages: MessageType[] = [
      {
        type: "user",
        response: inputText,
        searchWeb: enableSearch,
        pageFetchURL,
        date: fetchDate(),
        message_id: String(ObjectID()),
      },
      {
        searchWeb: enableSearch,
        pageFetchURL,
        type: "bot",
        response: "",
        message_id: bot_message_id,
        date: fetchDate(),
      },
    ];

    setConvoMessages((oldMessages) => {
      return oldMessages && oldMessages?.length > 0 // If there are no messages in the convo history set only the current message
        ? [...oldMessages, ...currentMessages]
        : [...currentMessages];
    });

    // If no existing conversation, create a new one.
    const conversationId =
      convoIdParam || (await createNewConversation(currentMessages));

    if (!conversationId) return setLoading(false);

    // Start fetching bot response stream.
    await fetchChatStream(
      inputText,
      currentMessages,
      conversationId,
      enableSearch,
      pageFetchURL,
      bot_message_id
    );
  };

  return { loading, updateConversation };
};
