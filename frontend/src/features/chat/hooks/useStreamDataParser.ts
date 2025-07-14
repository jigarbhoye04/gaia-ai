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
  google_docs_data?: {
    title: string;
    url: string;
    action?: string;
  };
};

export function parseStreamData(
  streamChunk: StreamChunk,
): Partial<MessageType> {
  if (!streamChunk) {
    return {};
  }

  const result: Partial<MessageType> = {};

  // Dynamically copy all defined properties from streamChunk to result
  // This automatically handles any tool data without manual if conditions
  for (const [key, value] of Object.entries(streamChunk)) {
    if (value !== undefined) {
      // Type assertion is safe here since we're iterating over streamChunk properties
      (result as Record<string, unknown>)[key] = value;
    }
  }

  return result;
}
