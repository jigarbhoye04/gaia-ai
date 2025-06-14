import React, { Dispatch } from "react";

import { FileData } from "@/types/shared/fileTypes";

import {
  CalendarDeleteOptions,
  CalendarEditOptions,
  CalendarOptions,
  DeepSearchResults,
  DocumentData,
  EmailComposeData,
  ImageData,
  SearchResults,
  WeatherData,
} from "./convoTypes";
import { TodoToolData } from "./todoToolTypes";

export interface ChatBubbleUserProps {
  message_id: string;
  text?: string;
  file?: File | null | string;
  filename?: string;
  searchWeb?: boolean;
  deepSearchWeb?: boolean;
  pageFetchURLs?: string[];
  date?: string;
  pinned?: boolean;
  fileIds?: string[];
  fileData?: FileData[];
}

export interface SetImageDataType {
  src: string; // corresponds to url in ImageData
  prompt: string;
  improvedPrompt: string; // corresponds to improved_prompt in ImageData
}

export interface ChatBubbleBotProps {
  message_id: string;
  text: string;
  loading?: boolean;
  searchWeb?: boolean;
  deepSearchWeb?: boolean;
  disclaimer?: string;
  date?: string;
  setOpenImage: React.Dispatch<React.SetStateAction<boolean>>;
  setImageData: Dispatch<React.SetStateAction<SetImageDataType>>;
  pageFetchURLs?: string[];
  filename?: string;
  pinned?: boolean;

  intent?: string;
  calendar_options?: CalendarOptions[] | null;
  calendar_delete_options?: CalendarDeleteOptions[] | null;
  calendar_edit_options?: CalendarEditOptions[] | null;
  email_compose_data?: EmailComposeData | null;
  weather_data?: WeatherData | null;
  search_results?: SearchResults | null;
  deep_search_results?: DeepSearchResults | null;
  document_data?: DocumentData | null; // document data from backend tools
  image_data?: ImageData | null;
  todo_data?: TodoToolData | null; // todo data from backend tools

  // memory-related fields
  memory_data?: {
    type?: string;
    operation?: string;
    status?: string;
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
    content?: string;
    memory_id?: string;
    error?: string;
    timestamp?: string;
    conversation_id?: string;
  } | null;

  // Function to open the shared memory modal
  onOpenMemoryModal?: () => void;
}
