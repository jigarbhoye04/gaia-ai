import { MessageType } from "@/types/features/convoTypes";

type StreamChunk = Partial<MessageType> & {
  searchWeb?: boolean;
  deepSearchWeb?: boolean;
  pageFetchURLs?: string[];
  disclaimer?: string;
  memory_data?: {
    operation?: string;
    status?: string;
    memory_id?: string;
    content?: string;
    messages?: Array<{ role: string; content: string }>;
    metadata?: Record<string, unknown>;
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
    page?: number;
    page_size?: number;
    total_count?: number;
    has_next?: boolean;
    error?: string;
  };
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
  };
};

export function parseStreamData(
  streamChunk: StreamChunk,
): Partial<MessageType> {
  if (!streamChunk) {
    return {};
  }

  const result: Partial<MessageType> = {};

  // Basic message fields
  if (streamChunk.response !== undefined) {
    result.response = streamChunk.response;
  }

  // Only include fields that are explicitly present in the stream chunk
  // This prevents overwriting existing data with undefined/null values
  if (streamChunk.intent !== undefined) {
    result.intent = streamChunk.intent;
  }

  if (streamChunk.calendar_options !== undefined) {
    result.calendar_options = streamChunk.calendar_options;
  }

  if (streamChunk.calendar_delete_options !== undefined) {
    result.calendar_delete_options = streamChunk.calendar_delete_options;
  }

  if (streamChunk.calendar_edit_options !== undefined) {
    result.calendar_edit_options = streamChunk.calendar_edit_options;
  }

  if (streamChunk.email_compose_data !== undefined) {
    result.email_compose_data = streamChunk.email_compose_data;
  }

  if (streamChunk.weather_data !== undefined) {
    result.weather_data = streamChunk.weather_data;
  }

  if (streamChunk.search_results !== undefined) {
    result.search_results = streamChunk.search_results;
  }

  if (streamChunk.deep_search_results !== undefined) {
    result.deep_search_results = streamChunk.deep_search_results;
  }

  if (streamChunk.image_data !== undefined) {
    result.image_data = streamChunk.image_data;
  }

  if (streamChunk.todo_data !== undefined) {
    result.todo_data = streamChunk.todo_data;
  }

  if (streamChunk.code_data !== undefined) {
    result.code_data = streamChunk.code_data;
  }

  // Include other stream-specific fields
  if (streamChunk.searchWeb !== undefined) {
    result.searchWeb = streamChunk.searchWeb;
  }

  if (streamChunk.deepSearchWeb !== undefined) {
    result.deepSearchWeb = streamChunk.deepSearchWeb;
  }

  if (streamChunk.pageFetchURLs !== undefined) {
    result.pageFetchURLs = streamChunk.pageFetchURLs;
  }

  if (streamChunk.disclaimer !== undefined) {
    result.disclaimer = streamChunk.disclaimer;
  }

  // memory-related fields
  if (streamChunk.memory_data !== undefined) {
    result.memory_data = streamChunk.memory_data;
  }

  if (streamChunk.document_data !== undefined) {
    result.document_data = streamChunk.document_data;
  }

  // goal-related fields
  if (streamChunk.goal_data !== undefined) {
    result.goal_data = streamChunk.goal_data;
  }

  return result;
}
