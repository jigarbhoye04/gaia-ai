// Define the structure for each message in the conversation
// This type represents an individual message, including details about whether it's from the user or bot,

import { FileData } from "@/types/shared/fileTypes";

import {
  CalendarDeleteOptions,
  CalendarEditOptions,
  CalendarEventDateTime,
  CalendarOptions,
} from "./calendarTypes";
import { EmailComposeData } from "./mailTypes";
import {
  DeepSearchResults,
  EnhancedWebResult,
  ImageResult,
  NewsResult,
  SearchResults,
  VideoResult,
  WebResult,
} from "./searchTypes";
import { TodoToolData } from "./todoToolTypes";
import {
  CodeData,
  DocumentData,
  GoalDataMessageType,
  GoogleDocsData,
  ImageData,
  MemoryData,
} from "./toolDataTypes";
import { WeatherData } from "./weatherTypes";

// Re-export types for external consumption
export type {
  CalendarDeleteOptions,
  CalendarEditOptions,
  CalendarEventDateTime,
  CalendarOptions,
  CodeData,
  DeepSearchResults,
  DocumentData,
  EmailComposeData,
  EnhancedWebResult,
  GoalDataMessageType,
  GoogleDocsData,
  ImageData,
  ImageResult,
  MemoryData,
  NewsResult,
  SearchResults,
  VideoResult,
  WeatherData,
  WebResult,
};

// the content of the message, its date, and optional fields for loading state, images, files, etc.
export type MessageType = {
  message_id: string;
  type: "user" | "bot"; // Indicates whether the message is from the "user" or the "bot"
  response: string; // The content of the message, typically text
  date?: string | ""; // The date when the message was sent, formatted as DateType, or an empty string
  loading?: boolean; // Optional: Indicates whether the message is still loading (e.g., for bot responses)
  // Removed legacy image properties:
  // imageUrl?: string;
  // imagePrompt?: string;
  // improvedImagePrompt?: string;
  searchWeb?: boolean | false;
  deepSearchWeb?: boolean | false;
  pageFetchURLs?: string[] | []; // Optional: URLs for fetching webpage content
  disclaimer?: string; // Optional: Any disclaimer associated with the message (e.g., for AI-generated content)
  fileIds?: string[];
  pinned?: boolean;
  fileData?: FileData[];
  intent?: string;
  calendar_options?: CalendarOptions[] | null;
  calendar_delete_options?: CalendarDeleteOptions[] | null;
  calendar_edit_options?: CalendarEditOptions[] | null;
  email_compose_data?: EmailComposeData | null;
  weather_data?: WeatherData | null;
  search_results?: SearchResults | null;
  deep_search_results?: DeepSearchResults | null;
  image_data?: ImageData | null; // Image generation data in structured format
  todo_data?: TodoToolData | null; // todo data from backend tools
  document_data?: DocumentData | null;
  code_data?: CodeData | null; // code execution data from backend
  memory_data?: MemoryData | null; // memory-related fields
  goal_data?: GoalDataMessageType | null; // goal-related fields
  google_docs_data?: GoogleDocsData | null; // Google Docs data from backend tools
};

// Define the structure for a single conversation
// This type represents an individual conversation, with a description and an array of messages.
export type ConversationType = {
  description: string; // A description or title of the conversation
  messages: MessageType[]; // An array of MessageType, representing the messages exchanged in the conversation
};

export interface IntentType {
  intent: string | undefined;
  calendar_options?: CalendarOptions[] | null;
  calendar_delete_options?: CalendarDeleteOptions[] | null;
  calendar_edit_options?: CalendarEditOptions[] | null;
  email_compose_data?: EmailComposeData | null;
  weather_data?: WeatherData | null;
}
