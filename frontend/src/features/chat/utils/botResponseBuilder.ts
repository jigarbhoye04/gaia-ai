// utils/botResponseBuilder.ts
import { IntentType, MessageType } from "@/types/features/convoTypes";
import fetchDate from "@/utils/date/dateUtils";

export const buildBotResponse = (
  botMessageId: string,
  botResponseText: string,
  enableSearch: boolean,
  pageFetchURLs: string[],
  finalIntent: IntentType,
  overrides: Partial<MessageType> = {},
): MessageType => ({
  type: "bot",
  message_id: botMessageId,
  response: botResponseText,
  searchWeb: enableSearch,
  pageFetchURLs,
  date: fetchDate(),
  intent: finalIntent.intent,
  calendar_options: finalIntent.calendar_options,
  email_compose_data: finalIntent.email_compose_data,
  weather_data: finalIntent.weather_data,
  ...overrides,
});
