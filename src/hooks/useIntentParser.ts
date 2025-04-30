import { MessageType } from "@/types/convoTypes";

export function parseIntent(dataJson: MessageType) {
  if (!dataJson) {
    return { intent: undefined } as MessageType;
  }

  const result = { ...dataJson };

  // Set intent
  result.intent = dataJson.intent || undefined;

  // Handle each special field individually with proper typing
  result.calendar_options = dataJson.calendar_options || null;
  result.weather_data = dataJson.weather_data || null;
  result.search_results = dataJson.search_results || null;
  result.deep_search_results = dataJson.deep_search_results || null;
  result.image_data = dataJson.image_data || null;

  return result;
}
