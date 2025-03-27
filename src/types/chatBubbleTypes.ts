import React, { Dispatch } from "react";

import { CalendarOptions, DeepSearchResults, SearchResults } from "./convoTypes";
import { FileData } from "@/components/Chat/SearchBar/MainSearchbar";


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
  src: string;
  prompt: string;
  improvedPrompt: string;
}

export interface ChatBubbleBotProps {
  // index: number;
  message_id: string;
  text: string;
  loading?: boolean;
  isImage?: boolean;
  searchWeb?: boolean;
  deepSearchWeb?: boolean;
  imageSrc?: string | null;
  imagePrompt?: string;
  improvedImagePrompt?: string;
  disclaimer?: string;
  date?: string;
  // userinputType?: string;
  setOpenImage: React.Dispatch<React.SetStateAction<boolean>>;
  setImageData: Dispatch<React.SetStateAction<SetImageDataType>>;
  pageFetchURLs?: string[];
  filename?: string;
  pinned?: boolean;
  // setImageSrc: React.Dispatch<React.SetStateAction<string>>;
  // setImagePrompt: React.Dispatch<React.SetStateAction<string>>;

  intent?: string;
  calendar_options?: CalendarOptions[] | null;
  search_results?: SearchResults | null;
  deep_search_results?: DeepSearchResults | null;
}
