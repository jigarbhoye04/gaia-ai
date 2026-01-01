import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";
import { shallow } from "zustand/shallow";
import { chatApi, fetchChatStream, type Message } from "../api/chat-api";
import { useChatStore } from "@/stores/chat-store";

const EMPTY_MESSAGES: Message[] = [];
const NEW_CHAT_KEY = "__new__";

export type { Message } from "../api/chat-api";

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  pendingRedirect: string | null;
  flatListRef: React.RefObject<FlatList | null>;
  sendMessage: (text: string) => Promise<void>;
  cancelStream: () => void;
  scrollToBottom: () => void;
  refetch: () => Promise<void>;
  clearPendingRedirect: () => void;
}

export function useChat(chatId: string | null): UseChatReturn {
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingResponseRef = useRef<string>("");
  const currentConversationIdRef = useRef<string | null>(chatId);
  const [isLoading, setIsLoading] = useState(false);

  // For new chats (chatId is null), use the NEW_CHAT_KEY to store messages temporarily
  const storeKey = chatId || NEW_CHAT_KEY;

  const messages = useChatStore(
    (state) => state.messagesByConversation[storeKey] ?? EMPTY_MESSAGES,
    shallow
  );
  const streamingState = useChatStore((state) => state.streamingState, shallow);
  const pendingRedirect = useChatStore((state) => state.pendingRedirect);

  const isTyping = streamingState.isTyping && (streamingState.conversationId === storeKey || streamingState.conversationId === chatId);
  const isStreaming = streamingState.isStreaming && (streamingState.conversationId === storeKey || streamingState.conversationId === chatId);

  useEffect(() => {
    currentConversationIdRef.current = chatId;
  }, [chatId]);

  const isServerConversation = useCallback((id: string | null): boolean => {
    if (!id) return false;
    if (id === NEW_CHAT_KEY || id.startsWith("chat-") || id === "new") return false;
    return true;
  }, []);

  const fetchMessagesFromServer = useCallback(
    async (conversationId: string) => {
      const store = useChatStore.getState();
      
      if (store.isConversationFetched(conversationId)) {
        return;
      }

      setIsLoading(true);
      try {
        const serverMessages = await chatApi.fetchMessages(conversationId);
        if (serverMessages.length > 0) {
          store.setMessages(conversationId, serverMessages);
          store.markConversationFetched(conversationId);
          await chatApi.markConversationAsRead(conversationId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!chatId) {
      return;
    }

    if (isServerConversation(chatId)) {
      fetchMessagesFromServer(chatId);
    }
  }, [chatId, isServerConversation, fetchMessagesFromServer]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    useChatStore.getState().setStreamingState({ 
      isStreaming: false, 
      isTyping: false, 
      conversationId: null 
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      cancelStream();

      const store = useChatStore.getState();
      
      // Use storeKey for storing messages (NEW_CHAT_KEY for new chats, chatId for existing)
      const messageStoreKey = chatId || NEW_CHAT_KEY;

      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
      };

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        text: "",
        isUser: false,
        timestamp: new Date(),
      };

      const currentMessages = store.messagesByConversation[messageStoreKey] || [];
      const updatedMessages = [...currentMessages, userMessage, aiMessage];
      
      store.setMessages(messageStoreKey, updatedMessages);
      store.setStreamingState({ isTyping: true, isStreaming: true, conversationId: messageStoreKey });
      streamingResponseRef.current = "";

      try {
        // For new conversations, send null; for existing ones, send the actual ID
        const conversationIdToSend = chatId && isServerConversation(chatId) ? chatId : null;
        const isNewConversation = !conversationIdToSend;

        const controller = await fetchChatStream(
          {
            message: text,
            conversationId: conversationIdToSend,
            messages: updatedMessages.slice(0, -1), // Pass Message[] format, it will be converted in fetchChatStream
          },
          {
            onConversationCreated: (newConvId, userMsgId, botMsgId) => {
              // First event - we get the conversation ID and message IDs
              const store = useChatStore.getState();
              
              // Update message IDs
              const msgs = store.messagesByConversation[messageStoreKey] || [];
              if (msgs.length >= 2) {
                const updatedMsgs = [...msgs];
                // Update user message ID
                updatedMsgs[updatedMsgs.length - 2] = { ...updatedMsgs[updatedMsgs.length - 2], id: userMsgId };
                // Update bot message ID
                updatedMsgs[updatedMsgs.length - 1] = { ...updatedMsgs[updatedMsgs.length - 1], id: botMsgId };
                store.setMessages(messageStoreKey, updatedMsgs);
              }

              // If this was a new conversation, migrate messages to the real conversation ID
              if (isNewConversation && newConvId) {
                store.migrateMessages(messageStoreKey, newConvId);
                store.markConversationFetched(newConvId);
                currentConversationIdRef.current = newConvId;
                store.setStreamingState({ conversationId: newConvId });
                store.setPendingRedirect(newConvId);
              }
            },
            onChunk: (chunk) => {
              streamingResponseRef.current += chunk;
              const convId = currentConversationIdRef.current || NEW_CHAT_KEY;
              useChatStore.getState().updateLastMessage(convId, streamingResponseRef.current);
            },
            onFollowUpActions: (actions) => {
              const convId = currentConversationIdRef.current || NEW_CHAT_KEY;
              useChatStore.getState().updateLastMessageFollowUp(convId, actions);
            },
            onDone: () => {
              useChatStore.getState().setStreamingState({ 
                isTyping: false, 
                isStreaming: false, 
                conversationId: null 
              });
              abortControllerRef.current = null;
            },
            onError: (error) => {
              console.error("Stream error:", error);
              const store = useChatStore.getState();
              store.setStreamingState({ 
                isTyping: false, 
                isStreaming: false, 
                conversationId: null 
              });

              const convId = currentConversationIdRef.current || NEW_CHAT_KEY;
              const currentMsgs = store.messagesByConversation[convId] || [];
              const lastMsg = currentMsgs[currentMsgs.length - 1];
              if (lastMsg && !lastMsg.isUser && !lastMsg.text) {
                store.updateLastMessage(convId, "Sorry, I encountered an error. Please try again.");
              }
            },
          }
        );

        abortControllerRef.current = controller;
      } catch (error) {
        console.error("Error starting stream:", error);
        useChatStore.getState().setStreamingState({ 
          isTyping: false, 
          isStreaming: false, 
          conversationId: null 
        });
      }
    },
    [chatId, cancelStream, isServerConversation]
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    if (chatId && isServerConversation(chatId)) {
      useChatStore.getState().clearConversationFetched(chatId);
      await fetchMessagesFromServer(chatId);
    }
  }, [chatId, isServerConversation, fetchMessagesFromServer]);

  const clearPendingRedirect = useCallback(() => {
    useChatStore.getState().clearPendingRedirect();
  }, []);

  return {
    messages,
    isTyping,
    isLoading,
    isStreaming,
    pendingRedirect,
    flatListRef,
    sendMessage,
    cancelStream,
    scrollToBottom,
    refetch,
    clearPendingRedirect,
  };
}
