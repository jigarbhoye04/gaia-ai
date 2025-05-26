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
            // Convert skip/limit to page/per_page for new API
            if (key === "skip" && filters.limit) {
              const page = Math.floor(Number(value) / filters.limit) + 1;
              params.append("page", String(page));
            } else if (key === "limit") {
              params.append("per_page", String(value));
            } else if (key !== "skip") {
              params.append(key, String(value));
            }
          }
        });
      }
      const response = await apiauth.get(`/todos?${params.toString()}`);
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      // Fallback for old format
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

  // Subtask operations (Note: Backend doesn't have separate subtask endpoints)
  // These need to be implemented via todo updates
  addSubtask: async (todoId: string, subtask: SubtaskCreate): Promise<Todo> => {
    try {
      // First get the todo
      const todo = await TodoService.getTodo(todoId);

      // Add new subtask with generated ID
      const newSubtask = {
        id: Date.now().toString(), // Simple ID generation
        title: subtask.title,
        completed: false,
        created_at: new Date().toISOString(),
      };

      // Update todo with new subtasks array
      const response = await apiauth.put(`/todos/${todoId}`, {
        subtasks: [...todo.subtasks, newSubtask],
      });

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
      // First get the todo
      const todo = await TodoService.getTodo(todoId);

      // Update the specific subtask
      const updatedSubtasks = todo.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, ...update } : st,
      );

      // Update todo with modified subtasks array
      const response = await apiauth.put(`/todos/${todoId}`, {
        subtasks: updatedSubtasks,
      });

      return response.data;
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast.error("Failed to update subtask");
      throw error;
    }
  },

  deleteSubtask: async (todoId: string, subtaskId: string): Promise<Todo> => {
    try {
      // First get the todo
      const todo = await TodoService.getTodo(todoId);

      // Remove the subtask
      const updatedSubtasks = todo.subtasks.filter((st) => st.id !== subtaskId);

      // Update todo with modified subtasks array
      const response = await apiauth.put(`/todos/${todoId}`, {
        subtasks: updatedSubtasks,
      });

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
      // Handle new API response format
      if (response.data.updated && Array.isArray(response.data.updated)) {
        return response.data.updated;
      }
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
      // Handle new API response format
      if (response.data.updated && Array.isArray(response.data.updated)) {
        return response.data.updated;
      }
      return response.data;
    } catch (error) {
      console.error("Error moving todos:", error);
      toast.error("Failed to move tasks");
      throw error;
    }
  },

  bulkDeleteTodos: async (todoIds: string[]): Promise<void> => {
    try {
      await apiauth.delete("/todos/bulk", { data: todoIds });
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
        `/todos?q=${encodeURIComponent(query)}`,
      );
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error searching todos:", error);
      toast.error("Failed to search tasks");
      throw error;
    }
  },

  getTodoStats: async (): Promise<TodoStats> => {
    try {
      const response = await apiauth.get(
        "/todos?include_stats=true&per_page=1",
      );
      // Extract stats from new API response
      if (response.data.stats) {
        return response.data.stats;
      }
      // Fallback to old endpoint
      const statsResponse = await apiauth.get("/todos/stats");
      return statsResponse.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch statistics");
      throw error;
    }
  },

  getTodayTodos: async (): Promise<Todo[]> => {
    try {
      const response = await apiauth.get("/todos?due_today=true");
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching today's todos:", error);
      toast.error("Failed to fetch today's tasks");
      throw error;
    }
  },

  getUpcomingTodos: async (_days: number = 7): Promise<Todo[]> => {
    try {
      // Note: Backend uses due_this_week=true for 7 days, doesn't support custom days
      const response = await apiauth.get(`/todos?due_this_week=true`);
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error fetching upcoming todos:", error);
      toast.error("Failed to fetch upcoming tasks");
      throw error;
    }
  },

  getAllLabels: async (): Promise<{ name: string; count: number }[]> => {
    try {
      // Try to get labels from stats first (more efficient)
      const response = await apiauth.get(
        "/todos?include_stats=true&per_page=1",
      );

      if (response.data.stats && response.data.stats.labels) {
        return response.data.stats.labels;
      }

      // Fallback: fetch todos and extract labels
      if (response.data.data && Array.isArray(response.data.data)) {
        const fullResponse = await apiauth.get("/todos?per_page=1000");
        if (fullResponse.data.data && Array.isArray(fullResponse.data.data)) {
          const todos = fullResponse.data.data;
          const labelCounts: Record<string, number> = {};

          // Count labels from todos
          todos.forEach((todo: Todo) => {
            if (todo.labels && Array.isArray(todo.labels)) {
              todo.labels.forEach((label: string) => {
                labelCounts[label] = (labelCounts[label] || 0) + 1;
              });
            }
          });

          // Convert to array format
          return Object.entries(labelCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        }
      }

      // Return empty array if no data
      return [];
    } catch (error) {
      console.error("Error fetching labels:", error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  getTodosByLabel: async (
    label: string,
    skip?: number,
    limit?: number,
  ): Promise<Todo[]> => {
    try {
      const params = new URLSearchParams();
      params.append("labels", label);
      if (skip !== undefined && limit !== undefined) {
        const page = Math.floor(skip / limit) + 1;
        params.append("page", String(page));
        params.append("per_page", String(limit));
      }

      const response = await apiauth.get(`/todos?${params.toString()}`);
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
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
      params.append("mode", "semantic");

      if (options?.limit) params.append("per_page", String(options.limit));
      if (options?.project_id) params.append("project_id", options.project_id);
      if (options?.completed !== undefined)
        params.append("completed", String(options.completed));
      if (options?.priority) params.append("priority", options.priority);

      const response = await apiauth.get(`/todos?${params.toString()}`);
      // Handle new API response format
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error("Error in semantic search:", error);
      toast.error("Failed to perform semantic search");
      throw error;
    }
  },

  reindexTodos: async (
    batchSize?: number,
  ): Promise<{ message: string; batch_size: number; total_todos: number }> => {
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
