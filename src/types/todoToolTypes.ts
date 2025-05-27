// Todo Tool Types for AI Assistant Integration

import { Priority } from "./todoTypes";

export interface TodoToolData {
  todos?: TodoItem[];
  projects?: TodoProject[];
  stats?: TodoStats;
  action?: TodoAction;
  message?: string;
}

export type TodoAction = "list" | "create" | "update" | "search" | "stats";

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  labels: string[];
  due_date?: string;
  due_date_timezone?: string;
  project_id?: string;
  project?: TodoProject;
  subtasks: TodoSubtask[];
  created_at: string;
  updated_at: string;
}

export interface TodoSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoProject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_default?: boolean;
  todo_count?: number;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  upcoming: number;
}
