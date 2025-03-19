import { MessageType } from "@/types/convoTypes";

export function parseIntent(dataJson: MessageType) {
  if (!dataJson || !dataJson.intent) {
    return { ...dataJson, intent: undefined, calendar_options: null };
  }

  return {
    ...dataJson,
    intent: dataJson.intent,
    calendar_options: Array.isArray(dataJson.calendar_options)
      ? dataJson.calendar_options
      : dataJson.calendar_options
        ? [dataJson.calendar_options]
        : null,

    search_results: dataJson.search_results || null,
  };
}
