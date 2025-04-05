// Define the structure for each message in the conversation
// This type represents an individual message, including details about whether it's from the user or bot,

import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";

// the content of the message, its date, and optional fields for loading state, images, files, etc.
export type MessageType = {
  message_id: string;
  type: "user" | "bot"; // Indicates whether the message is from the "user" or the "bot"
  response: string; // The content of the message, typically text
  date?: string | ""; // The date when the message was sent, formatted as DateType, or an empty string
  loading?: boolean; // Optional: Indicates whether the message is still loading (e.g., for bot responses)
  isImage?: boolean; // Optional: Indicates if the message contains an image
  imageUrl?: string; // Optional: URL for the image if it's an image message
  imagePrompt?: string;
  searchWeb?: boolean | false;
  deepSearchWeb?: boolean | false;
  pageFetchURLs?: string[] | []; // Optional: URLs for fetching webpage content
  improvedImagePrompt?: string;
  disclaimer?: string; // Optional: Any disclaimer associated with the message (e.g., for AI-generated content)
  fileIds?: string[];
  pinned?: boolean;
  fileData?: FileData[];
  intent?: string;
  calendar_options?: CalendarOptions[] | null;
  weather_data?: WeatherData | null;
  search_results?: SearchResults | null;
  deep_search_results?: DeepSearchResults | null;
};

export type CalendarOptions = {
  summary: string | undefined;
  description: string | undefined;
  start: string | undefined;
  end: string | undefined;
};

// Weather data structure for weather intent
export type WeatherData = {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base?: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility?: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds?: {
    all: number;
  };
  dt: number;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id?: number;
  name: string;
  cod?: number;
  location: {
    city: string;
    country: string | null;
    region: string | null;
  };
  // New field for forecast data
  forecast?: Array<{
    date: string;
    timestamp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  }>;
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
  weather_data?: WeatherData | null;
}

export type WebResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
};

export type ImageResult = {
  title: string;
  url: string;
  source: string;
  thumbnail?: string;
};

export type NewsResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date: string;
};

export type VideoResult = {
  title: string;
  url: string;
  thumbnail: string;
  source: string;
};

// Define the overall SearchResults type.
export type SearchResults = {
  web?: WebResult[];
  images?: ImageResult[];
  news?: NewsResult[];
  videos?: VideoResult[];
};

// Enhanced result including full_content and screenshot_url
export type EnhancedWebResult = WebResult & {
  full_content?: string;
  screenshot_url?: string;
};

// Define the DeepSearchResults type for deep search results
export type DeepSearchResults = {
  original_search?: SearchResults;
  enhanced_results?: EnhancedWebResult[];
  screenshots_taken?: boolean;
  metadata?: {
    total_content_size?: number;
    elapsed_time?: number;
    query?: string;
  };
};
