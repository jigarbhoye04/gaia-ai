import { toast } from "sonner";

import {
  BulkMoveRequest,
  Project,
  ProjectCreate,
  ProjectUpdate,
  SubtaskCreate,
  SubtaskUpdate,
  Todo,
  TodoCreate,
  TodoFilters,
  TodoStats,
  TodoUpdate,
} from "@/types/todoTypes";
import { apiauth } from "@/utils/apiaxios";

export const TodoService = {
  // Todo CRUD operations
  createTodo: async (todo: TodoCreate): Promise<Todo> => {
    try {
      const response = await apiauth.post("/todos", todo);
      toast.success("Task created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating todo:", error);
      toast.error("Failed to create task");
      throw error;
    }
  },

  getTodo: async (todoId: string): Promise<Todo> => {
    try {
      const response = await apiauth.get(`/todos/${todoId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching todo:", error);
      toast.error("Failed to fetch task");
      throw error;
    }
  },

  getAllTodos: async (filters?: TodoFilters): Promise<Todo[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
          }
        });
      }
      const response = await apiauth.get(`/todos?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching todos:", error);
      toast.error("Failed to fetch tasks");
      throw error;
    }
  },

  updateTodo: async (todoId: string, update: TodoUpdate): Promise<Todo> => {
    try {
      const response = await apiauth.put(`/todos/${todoId}`, update);

      // Check if the response has the correct completed status
      if (
        update.completed !== undefined &&
        response.data.completed !== update.completed
      ) {
        console.error("Server returned wrong completed status!", {
          requested: update.completed,
          received: response.data.completed,
        });
      }

      toast.success("Task updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update task");
      throw error;
    }
  },

  deleteTodo: async (todoId: string): Promise<void> => {
    try {
      await apiauth.delete(`/todos/${todoId}`);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete task");
      throw error;
    }
  },

  // Project operations
  createProject: async (project: ProjectCreate): Promise<Project> => {
    try {
      const response = await apiauth.post("/projects", project);
      toast.success("Project created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
      throw error;
    }
  },

  getAllProjects: async (): Promise<Project[]> => {
    try {
      const response = await apiauth.get("/projects");
      return response.data;
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
      throw error;
    }
  },

  updateProject: async (
    projectId: string,
    update: ProjectUpdate,
  ): Promise<Project> => {
    try {
      const response = await apiauth.put(`/projects/${projectId}`, update);
      toast.success("Project updated successfully");
      return response.data;
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
      throw error;
    }
  },

  deleteProject: async (projectId: string): Promise<void> => {
    try {
      await apiauth.delete(`/projects/${projectId}`);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
      throw error;
    }
  },

  // Subtask operations
  addSubtask: async (todoId: string, subtask: SubtaskCreate): Promise<Todo> => {
    try {
      const response = await apiauth.post(`/todos/${todoId}/subtasks`, subtask);
      toast.success("Subtask added successfully");
      return response.data;
    } catch (error) {
      console.error("Error adding subtask:", error);
      toast.error("Failed to add subtask");
      throw error;
    }
  },

  updateSubtask: async (
    todoId: string,
    subtaskId: string,
    update: SubtaskUpdate,
  ): Promise<Todo> => {
    try {
      const response = await apiauth.put(
        `/todos/${todoId}/subtasks/${subtaskId}`,
        update,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast.error("Failed to update subtask");
      throw error;
    }
  },

  deleteSubtask: async (todoId: string, subtaskId: string): Promise<Todo> => {
    try {
      const response = await apiauth.delete(
        `/todos/${todoId}/subtasks/${subtaskId}`,
      );
      toast.success("Subtask deleted successfully");
      return response.data;
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error("Failed to delete subtask");
      throw error;
    }
  },

  // Bulk operations
  bulkCompleteTodos: async (todoIds: string[]): Promise<Todo[]> => {
    try {
      const response = await apiauth.post("/todos/bulk/complete", todoIds);
      toast.success(`${todoIds.length} tasks completed`);
      return response.data;
    } catch (error) {
      console.error("Error completing todos:", error);
      toast.error("Failed to complete tasks");
      throw error;
    }
  },

  bulkMoveTodos: async (request: BulkMoveRequest): Promise<Todo[]> => {
    try {
      const response = await apiauth.post("/todos/bulk/move", request);
      toast.success(`${request.todo_ids.length} tasks moved`);
      return response.data;
    } catch (error) {
      console.error("Error moving todos:", error);
      toast.error("Failed to move tasks");
      throw error;
    }
  },

  bulkDeleteTodos: async (todoIds: string[]): Promise<void> => {
    try {
      await apiauth.delete("/todos/bulk/delete", { data: todoIds });
      toast.success(`${todoIds.length} tasks deleted`);
    } catch (error) {
      console.error("Error deleting todos:", error);
      toast.error("Failed to delete tasks");
      throw error;
    }
  },

  // Search and stats
  searchTodos: async (query: string): Promise<Todo[]> => {
    try {
      const response = await apiauth.get(
        `/todos/search?q=${encodeURIComponent(query)}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error searching todos:", error);
      toast.error("Failed to search tasks");
      throw error;
    }
  },

  getTodoStats: async (): Promise<TodoStats> => {
    try {
      const response = await apiauth.get("/todos/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch statistics");
      throw error;
    }
  },

  getTodayTodos: async (): Promise<Todo[]> => {
    try {
      const response = await apiauth.get("/todos/today");
      return response.data;
    } catch (error) {
      console.error("Error fetching today's todos:", error);
      toast.error("Failed to fetch today's tasks");
      throw error;
    }
  },

  getUpcomingTodos: async (days: number = 7): Promise<Todo[]> => {
    try {
      const response = await apiauth.get(`/todos/upcoming?days=${days}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming todos:", error);
      toast.error("Failed to fetch upcoming tasks");
      throw error;
    }
  },

  getAllLabels: async (): Promise<{ name: string; count: number }[]> => {
    try {
      const response = await apiauth.get("/todos/labels");
      return response.data;
    } catch (error) {
      console.error("Error fetching labels:", error);
      toast.error("Failed to fetch labels");
      throw error;
    }
  },

  getTodosByLabel: async (
    label: string,
    skip?: number,
    limit?: number,
  ): Promise<Todo[]> => {
    try {
      const params = new URLSearchParams();
      if (skip !== undefined) params.append("skip", String(skip));
      if (limit !== undefined) params.append("limit", String(limit));

      const response = await apiauth.get(
        `/todos/by-label/${encodeURIComponent(label)}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching todos by label:", error);
      toast.error("Failed to fetch todos by label");
      throw error;
    }
  },

  semanticSearchTodos: async (
    query: string,
    options?: {
      limit?: number;
      project_id?: string;
      completed?: boolean;
      priority?: string;
    },
  ): Promise<Todo[]> => {
    try {
      const params = new URLSearchParams();
      params.append("q", query);

      if (options?.limit) params.append("limit", String(options.limit));
      if (options?.project_id) params.append("project_id", options.project_id);
      if (options?.completed !== undefined)
        params.append("completed", String(options.completed));
      if (options?.priority) params.append("priority", options.priority);

      const response = await apiauth.get(
        `/todos/search/semantic?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error in semantic search:", error);
      toast.error("Failed to perform semantic search");
      throw error;
    }
  },

  reindexTodos: async (batchSize?: number): Promise<Todo> => {
    try {
      const params = new URLSearchParams();
      if (batchSize) params.append("batch_size", String(batchSize));

      const response = await apiauth.post(
        `/todos/reindex?${params.toString()}`,
      );
      toast.success("Todo index refreshed successfully");
      return response.data;
    } catch (error) {
      console.error("Error reindexing todos:", error);
      toast.error("Failed to refresh todo index");
      throw error;
    }
  },
};
