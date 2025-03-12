import { IntentType } from "@/types/convoTypes";

export function parseIntent(dataJson: any): any {
  if (!dataJson || !dataJson.intent) {
    return { ...dataJson, intent: undefined, calendar_options: null }; // ✅ Merge with original object
  }

  return {
    ...dataJson, // ✅ Keep all existing properties
    intent: dataJson.intent,
    calendar_options: Array.isArray(dataJson.calendar_options)
      ? dataJson.calendar_options
      : dataJson.calendar_options
      ? [dataJson.calendar_options]
      : null,
  };
}
