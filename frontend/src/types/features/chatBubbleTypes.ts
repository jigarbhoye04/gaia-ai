import React, { Dispatch } from "react";

import { SystemPurpose } from "@/features/chat/api/chatApi";
import { FileData } from "@/types/shared/fileTypes";

import {
  CalendarDeleteOptions,
  CalendarEditOptions,
  CalendarOptions,
  DeepResearchResults,
  DocumentData,
  EmailComposeData,
  GoogleDocsData,
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
  selectedTool?: string | null;
  toolCategory?: string | null;
  isConvoSystemGenerated: boolean;
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

  calendar_options?: CalendarOptions[] | null;
  calendar_delete_options?: CalendarDeleteOptions[] | null;
  calendar_edit_options?: CalendarEditOptions[] | null;
  email_compose_data?: EmailComposeData | null;
  weather_data?: WeatherData | null;
  search_results?: SearchResults | null;
  deep_research_results?: DeepResearchResults | null;
  document_data?: DocumentData | null;
  image_data?: ImageData | null;
  todo_data?: TodoToolData | null;
  code_data?: {
    language: string;
    code: string;
    output?: {
      stdout: string;
      stderr: string;
      results: string[];
      error: string | null;
    } | null;
    charts?: Array<{
      id: string;
      url: string;
      text: string;
    }> | null;
    status?: "executing" | "completed" | "error";
  } | null;

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

  // goal-related fields
  goal_data?: {
    goals?: Array<{
      id: string;
      title: string;
      description?: string;
      progress?: number;
      roadmap?: {
        nodes: Array<{
          id: string;
          data: {
            title?: string;
            label?: string;
            isComplete?: boolean;
            type?: string;
            subtask_id?: string;
          };
        }>;
        edges: Array<{
          id: string;
          source: string;
          target: string;
        }>;
      };
      created_at?: string;
      todo_project_id?: string;
      todo_id?: string;
    }>;
    action?: string;
    message?: string;
    goal_id?: string;
    deleted_goal_id?: string;
    stats?: {
      total_goals: number;
      goals_with_roadmaps: number;
      total_tasks: number;
      completed_tasks: number;
      overall_completion_rate: number;
      active_goals: Array<{
        id: string;
        title: string;
        progress: number;
      }>;
      active_goals_count: number;
    };
    error?: string;
  } | null;

  // Google Docs data from backend tools
  google_docs_data?: GoogleDocsData | null;

  // Function to open the shared memory modal
  onOpenMemoryModal?: () => void;

  isConvoSystemGenerated: boolean;
  systemPurpose?: SystemPurpose;
}
