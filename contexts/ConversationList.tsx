import React, {
  createContext,
  ReactNode,
  useContext,
  useState
} from "react";

import { apiauth } from "@/utils/apiaxios";

// Define the Conversation interface.
interface Conversation {
  conversation_id: string;
  description: string;
  starred?: boolean;
  createdAt: string;
}

// Define an interface for the pagination metadata.
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Define the context type including pagination.
interface ConversationContextType {
  conversations: Conversation[];
  fetchConversations: (
    page?: number,
    limit?: number,
    append?: boolean
  ) => Promise<void>;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  paginationMeta: PaginationMeta | null;
  setPaginationMeta: React.Dispatch<
    React.SetStateAction<PaginationMeta | null>
  >;
}

// Create the context.
const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

// Provider component.
export const ConversationListProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  );

  // Fetch conversations with pagination.
  // In ConversationListProvider.tsx
  // In ConversationListProvider.tsx
  const fetchConversations = async (page = 1, limit = 20, append = true) => {
    try {
      const response = await apiauth.get(
        `/conversations?page=${page}&limit=${limit}`
      );
      const data = response?.data;
      const newConversations: Conversation[] = data?.conversations ?? [];

      if (append) {
        setConversations((prev) => {
          // Combine previous and new conversations
          const combined = [...prev, ...newConversations];
          // Create a Map keyed by conversation_id; later values overwrite earlier ones
          const uniqueMap = new Map(
            combined.map((conv) => [conv.conversation_id, conv])
          );

          // Return the deduplicated array
          return Array.from(uniqueMap.values());
        });
      } else {
        setConversations(newConversations);
      }

      setPaginationMeta({
        total: data.total,
        page: data.page,
        limit: data.limit,
        total_pages: data.total_pages,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        fetchConversations,
        setConversations,
        paginationMeta,
        setPaginationMeta,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook to use the conversation context.
export const useConversationList = (): ConversationContextType => {
  const context = useContext(ConversationContext);

  if (!context) {
    throw new Error(
      "useConversationList must be used within a ConversationListProvider"
    );
  }

  return context;
};
