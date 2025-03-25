// "use client";

// import ObjectID from "bson-objectid";
// import { useRouter } from "next/navigation";
// import { useDispatch } from "react-redux";

// import { useChatStream } from "@/hooks/useChatStream";
// import { useFetchConversations } from "@/hooks/useConversationList";
// import { addMessage } from "@/redux/slices/conversationSlice";
// import { MessageType } from "@/types/convoTypes";
// import { createNewConversation } from "@/utils/chatUtils";
// import fetchDate from "@/utils/fetchDate";

// import { useLoading } from "./useLoading";
// import { SearchMode } from "@/components/Chat/SearchBar/MainSearchbar";

// export const useSendMessage = (convoIdParam: string | null) => {
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const { setIsLoading } = useLoading();
//   const fetchChatStream = useChatStream();
//   const fetchConversations = useFetchConversations();

//   // returns as sendMessage hook
//   return async (
//     inputText: string,
//     currentMode: SearchMode,
//     pageFetchURLs: string,
//   ) => {
//     setIsLoading(true);

//     const message_id = ObjectID().toString();
//     const date = fetchDate();
//     let mode = null;

//     if (currentMode === "web_search") mode = "web_search";
//     else if (currentMode === "deep_search") mode = "deep_search";
//     else if (currentMode === "fetch_webpage") mode = "fetch_webpage";

//     const userMessage = {
//       response: inputText,
//       is_bot: false,
//       date,
//       searchWeb: currentMode === "web_search",
//       pageFetchURL: pageFetchURLs, // This now contains comma-separated URLs
//       message_id,
//     };

//     dispatch(addMessage({ message: userMessage }));

//     try {
//       if (!convoIdParam) {
//         const convoResponse = await createNewConversation();
//         router.push(`/c/${convoResponse.convo_id}`);
//         await fetchConversations();
//       }

//       await fetchChatStream(
//         inputText,
//         convoIdParam,
//         message_id,
//         date,
//         mode,
//         pageFetchURLs, // Pass the comma-separated URLs
//       );
//     } catch (error) {
//       console.error("Error sending message:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };
// };


"use client";

import ObjectID from "bson-objectid";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

import { useChatStream } from "@/hooks/useChatStream";
import { useFetchConversations } from "@/hooks/useConversationList";
import { addMessage } from "@/redux/slices/conversationSlice";
import { MessageType } from "@/types/convoTypes";
import { createNewConversation } from "@/utils/chatUtils";
import fetchDate from "@/utils/fetchDate";

import { useLoading } from "./useLoading";
import { SearchMode } from "@/components/Chat/SearchBar/MainSearchbar";

export const useSendMessage = (convoIdParam: string | null) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setIsLoading } = useLoading();
  const fetchChatStream = useChatStream();
  const fetchConversations = useFetchConversations();

  // returns as sendMessage hook
  return async (
    inputText: string,
    currentMode: SearchMode,
    pageFetchURLs: string[],
  ) => {

    const enableSearch = currentMode === "web_search"
    const enableDeepSearch = currentMode === "deep_search"

    const botMessageId = String(ObjectID());

    const currentMessage: MessageType = {
      type: "user",
      response: inputText,
      searchWeb: enableSearch,
      deepSearchWeb: enableDeepSearch,
      pageFetchURLs,
      date: fetchDate(),
      message_id: String(ObjectID()),
    };

    dispatch(addMessage(currentMessage));

    const conversationId =
      convoIdParam ||
      (await createNewConversation(
        [currentMessage],
        router,
        fetchConversations,
      ));

    if (!conversationId) return setIsLoading(false);

    await fetchChatStream(
      inputText,
      [currentMessage],
      conversationId,
      enableSearch,
      enableDeepSearch,
      pageFetchURLs,
      botMessageId,
    );
  };
};
