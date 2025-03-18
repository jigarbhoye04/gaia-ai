// utils/botResponseBuilder.ts
import { IntentType,MessageType } from "@/types/convoTypes";
import fetchDate from "@/utils/fetchDate";

export const buildBotResponse = (
  botMessageId: string,
  botResponseText: string,
  enableSearch: boolean,
  pageFetchURL: string,
  finalIntent: IntentType,
  overrides: Partial<MessageType> = {},
): MessageType => ({
  type: "bot",
  message_id: botMessageId,
  response: botResponseText,
  searchWeb: enableSearch,
  pageFetchURL,
  date: fetchDate(),
  intent: finalIntent.intent,
  calendar_options: finalIntent.calendar_options,
  ...overrides,
});
