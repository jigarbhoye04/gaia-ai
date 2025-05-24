import { MessageType } from "@/types/convoTypes";

type StreamChunk = Partial<MessageType> & {
  searchWeb?: boolean;
  deepSearchWeb?: boolean;
  pageFetchURLs?: string[];
  disclaimer?: string;
  memory_operation?: string | null;
  memory_status?: string | null;
  memory_content?: string | null;
  memory_data?: {
    operation?: string;
    status?: string;
    memory_id?: string;
    content?: string;
    messages?: Array<{ role: string; content: string }>;
    metadata?: Record<string, unknown>;
    results?: Array<{
      id: string;
      content: string;
      relevance_score?: number;
      metadata?: Record<string, unknown>;
    }>;
    memories?: Array<{
      id: string;
      content: string;
      metadata?: Record<string, unknown>;
      created_at?: string;
    }>;
    count?: number;
    page?: number;
    page_size?: number;
    total_count?: number;
    has_next?: boolean;
    error?: string;
  };
};

export function parseStreamData(
  streamChunk: StreamChunk,
): Partial<MessageType> {
  if (!streamChunk) {
    return {};
  }

  const result: Partial<MessageType> = {};

  // Basic message fields
  if (streamChunk.response !== undefined) {
    result.response = streamChunk.response;
  }

  // Only include fields that are explicitly present in the stream chunk
  // This prevents overwriting existing data with undefined/null values
  if (streamChunk.intent !== undefined) {
    result.intent = streamChunk.intent;
  }

  if (streamChunk.calendar_options !== undefined) {
    result.calendar_options = streamChunk.calendar_options;
  }

  if (streamChunk.email_compose_data !== undefined) {
    result.email_compose_data = streamChunk.email_compose_data;
  }

  if (streamChunk.weather_data !== undefined) {
    result.weather_data = streamChunk.weather_data;
  }

  if (streamChunk.search_results !== undefined) {
    result.search_results = streamChunk.search_results;
  }

  if (streamChunk.deep_search_results !== undefined) {
    result.deep_search_results = streamChunk.deep_search_results;
  }

  if (streamChunk.image_data !== undefined) {
    result.image_data = streamChunk.image_data;
  }

  // Include other stream-specific fields
  if (streamChunk.searchWeb !== undefined) {
    result.searchWeb = streamChunk.searchWeb;
  }

  if (streamChunk.deepSearchWeb !== undefined) {
    result.deepSearchWeb = streamChunk.deepSearchWeb;
  }

  if (streamChunk.pageFetchURLs !== undefined) {
    result.pageFetchURLs = streamChunk.pageFetchURLs;
  }

  if (streamChunk.disclaimer !== undefined) {
    result.disclaimer = streamChunk.disclaimer;
  }

  // Memory-related fields
  if (streamChunk.memory_operation !== undefined) {
    result.memory_operation = streamChunk.memory_operation;
  }

  if (streamChunk.memory_status !== undefined) {
    result.memory_status = streamChunk.memory_status;
  }

  if (streamChunk.memory_content !== undefined) {
    result.memory_content = streamChunk.memory_content;
  }

  if (streamChunk.memory_data !== undefined) {
    result.memory_data = streamChunk.memory_data;
  }

  return result;
}
