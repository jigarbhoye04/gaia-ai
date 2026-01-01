import { createSSEConnection, type SSEEvent } from "@/lib/sse-client";
import type { Message } from "./chat-api";

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onMessageComplete?: (data: StreamCompleteData) => void;
  onFollowUpActions?: (actions: string[]) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

export interface StreamCompleteData {
  messageId: string;
  conversationId: string;
  response?: string;
  followUpActions?: string[];
}

export interface ChatStreamRequest {
  message: string;
  conversationId?: string | null;
  messages?: Message[];
  fileIds?: string[];
  fileData?: Array<{
    fileId: string;
    fileName?: string;
    fileSize?: number;
    contentType?: string;
    url?: string;
  }>;
  selectedTool?: string | null;
  toolCategory?: string | null;
}

interface StreamEventData {
  type?: string;
  content?: string;
  conversation_id?: string;
  message_id?: string;
  response?: string;
  error?: string;
  bot_message_id?: string;
  user_message_id?: string;
  main_response_complete?: boolean;
  follow_up_actions?: string[];
}

function parseEventData(data: string): StreamEventData | null {
  if (data === "[DONE]") {
    return { type: "done" };
  }
  
  try {
    return JSON.parse(data);
  } catch {
    return { type: "content", content: data };
  }
}

export async function fetchChatStream(
  request: ChatStreamRequest,
  callbacks: StreamCallbacks
): Promise<AbortController> {
  const {
    message,
    conversationId,
    messages = [],
    fileIds = [],
    fileData = [],
    selectedTool = null,
    toolCategory = null,
  } = request;

  const formattedMessages = messages
    .slice(-30)
    .filter((msg) => msg.text.trim().length > 0)
    .map((msg) => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text,
    }));

  const body = {
    conversation_id: conversationId || null,
    message,
    fileIds,
    fileData,
    selectedTool,
    toolCategory,
    messages: formattedMessages,
  };

  console.log("[ChatStream] Request body:", JSON.stringify(body, null, 2));

  return createSSEConnection(
    "/chat-stream",
    {
      onMessage: (event: SSEEvent) => {
        console.log("[ChatStream] Raw SSE event:", event.data);
        
        const parsed = parseEventData(event.data);
        console.log("[ChatStream] Parsed event:", parsed);
        
        if (!parsed) return;

        if (parsed.type === "done" || event.data === "[DONE]") {
          console.log("[ChatStream] Stream done");
          callbacks.onDone();
          return;
        }

        if (parsed.error) {
          console.log("[ChatStream] Error:", parsed.error);
          callbacks.onError?.(new Error(parsed.error));
          return;
        }

        if (parsed.response) {
          console.log("[ChatStream] Chunk:", parsed.response);
          callbacks.onChunk(parsed.response);
        }

        if (parsed.follow_up_actions && parsed.follow_up_actions.length > 0) {
          console.log("[ChatStream] Follow up actions:", parsed.follow_up_actions);
          callbacks.onFollowUpActions?.(parsed.follow_up_actions);
        }

        if (parsed.bot_message_id) {
          console.log("[ChatStream] Message IDs received:", parsed.bot_message_id);
        }

        if (parsed.message_id && parsed.conversation_id) {
          console.log("[ChatStream] Message complete:", parsed.message_id);
          callbacks.onMessageComplete?.({
            messageId: parsed.message_id,
            conversationId: parsed.conversation_id,
            response: parsed.response,
            followUpActions: parsed.follow_up_actions,
          });
        }
      },
      onError: (error) => {
        console.log("[ChatStream] Connection error:", error);
        callbacks.onError?.(error);
      },
      onClose: () => {
        callbacks.onDone();
      },
    },
    { body }
  );
}
