import { MessageType } from "@/types/convoTypes";

export function parseIntent(dataJson: MessageType) {
  if (!dataJson || !dataJson.intent) {
    return {
      ...dataJson,
      intent: undefined,
      calendar_options: null,
      weather_data: null,
    };
  }

  return {
    ...dataJson,
    intent: dataJson.intent,
    calendar_options: Array.isArray(dataJson.calendar_options)
      ? dataJson.calendar_options
      : dataJson.calendar_options
        ? [dataJson.calendar_options]
        : null,
    weather_data: dataJson.weather_data || null,
    search_results: dataJson.search_results || null,
    deep_search_results: dataJson.deep_search_results || null,
  };
}
