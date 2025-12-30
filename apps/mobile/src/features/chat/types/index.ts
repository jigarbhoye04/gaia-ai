// ============================================================================
// Chat Feature Types
// Centralized type definitions for the chat feature
// ============================================================================

// Re-export Message from chat-api for backwards compatibility
export type { Message, ApiFileData, ApiToolData } from "@/features/chat/api/chat-api";

import type { Message } from "@/features/chat/api/chat-api";

// ============================================================================
// Chat Session Types
// ============================================================================

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  activeSessionId?: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Normalized conversation object used throughout the app.
 * This is the frontend representation - different from API response.
 */
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_starred?: boolean;
  is_unread?: boolean;
}

/**
 * Grouped conversations by time period
 */
export interface GroupedConversations {
  starred: Conversation[];
  today: Conversation[];
  yesterday: Conversation[];
  lastWeek: Conversation[];
  older: Conversation[];
}

// ============================================================================
// UI Types
// ============================================================================

export interface Suggestion {
  id: string;
  iconUrl: string;
  text: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  isPro?: boolean;
  isDefault?: boolean;
}
