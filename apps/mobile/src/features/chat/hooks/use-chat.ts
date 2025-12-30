import { useCallback, useEffect, useRef, useState } from "react";
import type { FlatList } from "react-native";
import { chatApi, createConversation, fetchChatStream, type Message } from "../api/chat-api";

export type { Message } from "../api/chat-api";

const chatMessagesStore: Record<string, Message[]> = {};

const fetchedConversations = new Set<string>();

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  newConversationId: string | null;
  flatListRef: React.RefObject<FlatList | null>;
  sendMessage: (text: string) => Promise<void>;
  cancelStream: () => void;
  scrollToBottom: () => void;
  refetch: () => Promise<void>;
}

export function useChat(chatId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [newConversationId, setNewConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingResponseRef = useRef<string>("");
  const currentConversationIdRef = useRef<string | null>(chatId);

  useEffect(() => {
    currentConversationIdRef.current = chatId;
  }, [chatId]);

  const isServerConversation = useCallback((id: string | null): boolean => {
    if (!id) return false;
    if (id.startsWith("chat-") || id === "new") return false;
    return true;
  }, []);

  const fetchMessagesFromServer = useCallback(
    async (conversationId: string) => {
      if (fetchedConversations.has(conversationId)) {
        return;
      }

      setIsLoading(true);
      try {
        const serverMessages = await chatApi.fetchMessages(conversationId);
        if (serverMessages.length > 0) {
          chatMessagesStore[conversationId] = serverMessages;
          setMessages(serverMessages);
          fetchedConversations.add(conversationId);

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
      setMessages([]);
      return;
    }

    if (chatMessagesStore[chatId]) {
      setMessages(chatMessagesStore[chatId]);
    } else {
      setMessages([]);
    }

    if (isServerConversation(chatId)) {
      fetchMessagesFromServer(chatId);
    }
  }, [chatId, isServerConversation, fetchMessagesFromServer]);

  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId) {
        console.warn("Cannot send message without an active chatId");
        return;
      }

      cancelStream();

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

      const updatedMessages = [
        ...(chatMessagesStore[chatId] || []),
        userMessage,
        aiMessage,
      ];
      chatMessagesStore[chatId] = updatedMessages;
      setMessages(updatedMessages);
      setIsTyping(true);
      setIsStreaming(true);
      streamingResponseRef.current = "";

      try {
        let conversationIdToSend: string | null = null;
        
        console.log("[useChat] chatId:", chatId, "isServerConversation:", isServerConversation(chatId));
        
        if (isServerConversation(chatId)) {
          conversationIdToSend = chatId;
          console.log("[useChat] Using existing conversation:", conversationIdToSend);
        } else {
          console.log("[useChat] Creating new conversation...");
          const newConversation = await createConversation("New Chat");
          if (newConversation?.conversation_id) {
            conversationIdToSend = newConversation.conversation_id;
            console.log("[useChat] Created new conversation:", conversationIdToSend);
            chatMessagesStore[conversationIdToSend] = updatedMessages;
            delete chatMessagesStore[chatId];
            currentConversationIdRef.current = conversationIdToSend;
            setNewConversationId(conversationIdToSend);
          }
        }

        const cacheKey = conversationIdToSend || chatId;
        const messagesForApi = (chatMessagesStore[cacheKey] || []).slice(0, -1);
        
        const controller = await fetchChatStream(
          {
            message: text,
            conversationId: conversationIdToSend,
            messages: messagesForApi,
          },
          {
            onChunk: (chunk) => {
              streamingResponseRef.current += chunk;
              
              console.log("[useChat] onChunk - accumulated text:", streamingResponseRef.current);

              setMessages((prev) => {
                const newMessages = prev.map((msg, index) => {
                  if (index === prev.length - 1 && !msg.isUser) {
                    return { ...msg, text: streamingResponseRef.current };
                  }
                  return msg;
                });
                console.log("[useChat] Updated messages:", newMessages.length, "Last msg text:", newMessages[newMessages.length - 1]?.text?.substring(0, 50));
                return newMessages;
              });
            },
            onMessageComplete: ({ conversationId: newConvId, messageId }) => {
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && !lastMessage.isUser) {
                  lastMessage.id = messageId;
                }
                if (currentConversationIdRef.current) {
                  chatMessagesStore[currentConversationIdRef.current] =
                    newMessages;
                }
                return newMessages;
              });

              if (!conversationIdToSend && newConvId) {
                if (chatMessagesStore[chatId]) {
                  chatMessagesStore[newConvId] = chatMessagesStore[chatId];
                  delete chatMessagesStore[chatId];
                }
                fetchedConversations.add(newConvId);
              }
            },
            onDone: () => {
              setIsTyping(false);
              setIsStreaming(false);
              abortControllerRef.current = null;

              if (currentConversationIdRef.current) {
                setMessages((prev) => {
                  chatMessagesStore[currentConversationIdRef.current!] = prev;
                  return prev;
                });
              }
            },
            onError: (error) => {
              console.error("Stream error:", error);
              setIsTyping(false);
              setIsStreaming(false);

              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && !lastMessage.isUser && !lastMessage.text) {
                  lastMessage.text =
                    "Sorry, I encountered an error. Please try again.";
                }
                return newMessages;
              });
            },
          }
        );

        abortControllerRef.current = controller;
      } catch (error) {
        console.error("Error starting stream:", error);
        setIsTyping(false);
        setIsStreaming(false);
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
      fetchedConversations.delete(chatId);
      await fetchMessagesFromServer(chatId);
    }
  }, [chatId, isServerConversation, fetchMessagesFromServer]);

  return {
    messages,
    isTyping,
    isLoading,
    isStreaming,
    newConversationId,
    flatListRef,
    sendMessage,
    cancelStream,
    scrollToBottom,
    refetch,
  };
}
