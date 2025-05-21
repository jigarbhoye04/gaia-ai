import { MessageType } from "@/types/convoTypes";

export function parseStreamData(streamChunk: any): Partial<MessageType> {
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

  return result;
}
