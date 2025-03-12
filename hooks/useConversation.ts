import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useLoading } from "@/contexts/LoadingContext";
import { useChatStream } from "@/services/fetchChatStream";
import { MessageType } from "@/types/convoTypes";
import { createNewConversation, fetchMessages } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";
import ObjectID from "bson-objectid";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useConversation = (convoIdParam: string | null) => {
  const router = useRouter();
  const { setConvoMessages } = useConvo();
  const fetchChatStream = useChatStream();
  const { setIsLoading } = useLoading();
  const { fetchConversations } = useConversationList();

  useEffect(() => {
    if (convoIdParam) fetchMessages(convoIdParam, setConvoMessages, router);
    else router.push("/c");
  }, [convoIdParam]);

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
      convoIdParam ||
      (await createNewConversation(
        currentMessages,
        router,
        fetchConversations
      ));

    if (!conversationId) return setIsLoading(false);

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

  return { updateConversation };
};
