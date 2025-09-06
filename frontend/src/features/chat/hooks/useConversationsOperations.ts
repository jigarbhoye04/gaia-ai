import { useCallback } from "react";

import { chatApi } from "@/features/chat/api/chatApi";
import { useOnlinePolling } from "@/hooks/useOnlinePolling";
import { db } from "@/lib/db";
import {
  ConversationPaginationMeta,
  useConversationsStore,
} from "@/stores/conversationsStore";

export const useConversationsOperations = () => {
  const {
    setConversations,
    setPaginationMeta,
    setLoading,
    setError,
    clearError,
  } = useConversationsStore();

  const fetchConversations = useCallback(
    async (page = 1, limit = 20, append = true) => {
      setLoading(true);
      clearError();

      try {
        // First, try to load from IndexedDB
        const cachedConversations = await db.conversations.toArray();
        
        // Only set cached conversations if we're not appending and have cache
        if (!append && cachedConversations.length > 0) {
          setConversations(cachedConversations, false);
        }

        // Then, fetch from the API
        const data = await chatApi.fetchConversations(page, limit);

        const conversations = data.conversations ?? [];
        const paginationMeta: ConversationPaginationMeta = {
          total: data.total ?? 0,
          page: data.page ?? 1,
          limit: data.limit ?? limit,
          total_pages: data.total_pages ?? 1,
        };

        // Save to IndexedDB first
        await db.conversations.bulkPut(conversations);

        // Then update the UI state if we have conversations
        if (conversations.length > 0) {
          setConversations(conversations, append);
        }
        setPaginationMeta(paginationMeta);

        return { conversations, paginationMeta };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch conversations";
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setConversations, setPaginationMeta, setLoading, setError, clearError],
  );

  // Memoized polling to prevent unnecessary re-renders
  const pollingCallback = useCallback(() => fetchConversations(1, 1000, false), [fetchConversations]);

  const pollingConfig = {
    initialInterval: 60000,
    retryOnError: true,
    errorRetryMultiplier: 2,
    maxAttempts: 5,
    //to prevent infinite loops
    maxDuration: 3600000, // 1 hour
    shouldStop: (data: any) => !data || data.conversations?.length === 0
  };

  useOnlinePolling(pollingCallback, pollingConfig);

  return {
    fetchConversations,
  };
};
