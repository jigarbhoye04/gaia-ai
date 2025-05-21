import React, { Dispatch } from "react";

import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";

import {
  CalendarOptions,
  DeepSearchResults,
  EmailComposeData,
  ImageData,
  SearchResults,
  WeatherData,
} from "./convoTypes";

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
  email_compose_data?: EmailComposeData | null;
  weather_data?: WeatherData | null;
  search_results?: SearchResults | null;
  deep_search_results?: DeepSearchResults | null;
  image_data?: ImageData | null;
}
