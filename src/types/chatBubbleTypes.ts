import React, { Dispatch } from "react";

import { CalendarOptions, SearchResults } from "./convoTypes";

export interface ChatBubbleUserProps {
  message_id: string;
  text?: string;
  subtype?: "image" | "pdf" | null;
  file?: File | null | string;
  filename?: string;
  searchWeb?: boolean;
  pageFetchURL?: string;
  date?: string;
  pinned?: boolean;
}

interface SetImageDataType {
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
  imageSrc?: string | null;
  imagePrompt?: string;
  improvedImagePrompt?: string;
  disclaimer?: string;
  date?: string;
  // userinputType?: string;
  setOpenImage: React.Dispatch<React.SetStateAction<boolean>>;
  setImageData: Dispatch<React.SetStateAction<SetImageDataType>>;
  pageFetchURL?: string;
  filename?: string;
  pinned?: boolean;
  // setImageSrc: React.Dispatch<React.SetStateAction<string>>;
  // setImagePrompt: React.Dispatch<React.SetStateAction<string>>;

  intent?: string;
  calendar_options?: CalendarOptions[] | null;
  search_results?: SearchResults | null;
}
