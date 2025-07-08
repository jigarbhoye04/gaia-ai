import { apiService } from "@/lib/api";
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
  TodoListResponse,
  TodoStats,
  TodoUpdate,
  Workflow,
  WorkflowStatus,
} from "@/types/features/todoTypes";

export const todoApi = {
  // todo CRUD operations
  createTodo: async (todo: TodoCreate): Promise<Todo> => {
    return apiService.post<Todo>("/todos", todo, {
      successMessage: "Task created successfully",
      errorMessage: "Failed to create task",
    });
  },

  getTodo: async (todoId: string): Promise<Todo> => {
    return apiService.get<Todo>(`/todos/${todoId}`, {
      errorMessage: "Failed to fetch task",
      silent: true, // Don't show success for fetching
    });
  },

  getAllTodos: async (filters?: TodoFilters): Promise<Todo[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value != null && value !== "") {
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
      const response = await apiService.get<TodoListResponse | Todo[]>(
        `/todos?${params.toString()}`,
      );
      // Handle new API response format
      if (
        typeof response === "object" &&
        response !== null &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data;
      }
      // Fallback for old format
      return response as Todo[];
    } catch (error) {
      console.error("Error fetching todos:", error);
      throw error;
    }
  },

  updateTodo: async (todoId: string, update: TodoUpdate): Promise<Todo> => {
    const response = await apiService.put<Todo>(`/todos/${todoId}`, update, {
      successMessage: "Task updated successfully",
      errorMessage: "Failed to update task",
    });

    // Check if the response has the correct completed status
    if (
      update.completed !== undefined &&
      response.completed !== update.completed
    ) {
      console.error("Server returned wrong completed status!", {
        requested: update.completed,
        received: response.completed,
      });
    }

    return response;
  },

  deleteTodo: async (todoId: string): Promise<void> => {
    return apiService.delete(`/todos/${todoId}`, {
      successMessage: "Task deleted successfully",
      errorMessage: "Failed to delete task",
    });
  },

  // Project operations
  createProject: async (project: ProjectCreate): Promise<Project> => {
    return apiService.post<Project>("/projects", project, {
      successMessage: "Project created successfully",
      errorMessage: "Failed to create project",
    });
  },

  getAllProjects: async (): Promise<Project[]> => {
    return apiService.get<Project[]>("/projects", {
      errorMessage: "Failed to fetch projects",
      silent: true, // Don't show success for fetching
    });
  },

  updateProject: async (
    projectId: string,
    update: ProjectUpdate,
  ): Promise<Project> => {
    return apiService.put<Project>(`/projects/${projectId}`, update, {
      successMessage: "Project updated successfully",
      errorMessage: "Failed to update project",
    });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    return apiService.delete(`/projects/${projectId}`, {
      successMessage: "Project deleted successfully",
      errorMessage: "Failed to delete project",
    });
  },

  // Subtask operations (Note: Backend doesn't have separate subtask endpoints)
  // These need to be implemented via todo updates
  addSubtask: async (todoId: string, subtask: SubtaskCreate): Promise<Todo> => {
    // First get the todo
    const todo = await todoApi.getTodo(todoId);

    // Add new subtask with generated ID
    const newSubtask = {
      id: Date.now().toString(), // Simple ID generation
      title: subtask.title,
      completed: false,
      created_at: new Date().toISOString(),
    };

    // Update todo with new subtasks array
    return apiService.put<Todo>(
      `/todos/${todoId}`,
      {
        subtasks: [...todo.subtasks, newSubtask],
      },
      {
        successMessage: "Subtask added successfully",
        errorMessage: "Failed to add subtask",
      },
    );
  },

  updateSubtask: async (
    todoId: string,
    subtaskId: string,
    update: SubtaskUpdate,
  ): Promise<Todo> => {
    // First get the todo
    const todo = await todoApi.getTodo(todoId);

    // Update the specific subtask
    const updatedSubtasks = todo.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, ...update } : st,
    );

    // Update todo with modified subtasks array
    return apiService.put<Todo>(
      `/todos/${todoId}`,
      {
        subtasks: updatedSubtasks,
      },
      {
        silent: true, // Subtask updates are usually silent
      },
    );
  },

  deleteSubtask: async (todoId: string, subtaskId: string): Promise<Todo> => {
    // First get the todo
    const todo = await todoApi.getTodo(todoId);

    // Remove the subtask
    const updatedSubtasks = todo.subtasks.filter((st) => st.id !== subtaskId);

    // Update todo with modified subtasks array
    return apiService.put<Todo>(
      `/todos/${todoId}`,
      {
        subtasks: updatedSubtasks,
      },
      {
        successMessage: "Subtask deleted successfully",
        errorMessage: "Failed to delete subtask",
      },
    );
  },

  // Bulk operations
  bulkCompleteTodos: async (todoIds: string[]): Promise<Todo[]> => {
    const response = await apiService.post<{ updated: Todo[] } | Todo[]>(
      "/todos/bulk/complete",
      todoIds,
      {
        successMessage: `${todoIds.length} tasks completed`,
        errorMessage: "Failed to complete tasks",
      },
    );
    // Handle new API response format
    if (
      typeof response === "object" &&
      response !== null &&
      "updated" in response &&
      Array.isArray(response.updated)
    ) {
      return response.updated;
    }
    return response as Todo[];
  },

  bulkMoveTodos: async (request: BulkMoveRequest): Promise<Todo[]> => {
    const response = await apiService.post<{ updated: Todo[] } | Todo[]>(
      "/todos/bulk/move",
      request,
      {
        successMessage: `${request.todo_ids.length} tasks moved`,
        errorMessage: "Failed to move tasks",
      },
    );
    // Handle new API response format
    if (
      typeof response === "object" &&
      response !== null &&
      "updated" in response &&
      Array.isArray(response.updated)
    ) {
      return response.updated;
    }
    return response as Todo[];
  },

  bulkDeleteTodos: async (todoIds: string[]): Promise<void> => {
    return apiService.delete("/todos/bulk", todoIds, {
      successMessage: `${todoIds.length} tasks deleted`,
      errorMessage: "Failed to delete tasks",
    });
  },

  // search and stats
  searchTodos: async (query: string): Promise<Todo[]> => {
    const response = await apiService.get<TodoListResponse | Todo[]>(
      `/todos?q=${encodeURIComponent(query)}`,
      {
        silent: true, // Search operations are usually silent
      },
    );
    // Handle new API response format
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }
    return response as Todo[];
  },

  getTodoStats: async (): Promise<TodoStats> => {
    const response = await apiService.get<TodoListResponse>(
      "/todos?include_stats=true&per_page=1",
      {
        silent: true, // Stats fetching is usually silent
      },
    );
    // Extract stats from new API response
    if (response.stats) {
      return response.stats;
    }
    // Fallback to old endpoint
    return apiService.get<TodoStats>("/todos/stats", {
      silent: true,
    });
  },

  getTodayTodos: async (): Promise<Todo[]> => {
    const response = await apiService.get<TodoListResponse | Todo[]>(
      "/todos?due_today=true",
      {
        silent: true, // Fetching operations are usually silent
      },
    );
    // Handle new API response format
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }
    return response as Todo[];
  },

  getUpcomingTodos: async (_days: number = 7): Promise<Todo[]> => {
    // Note: Backend uses due_this_week=true for 7 days, doesn't support custom days
    const response = await apiService.get<TodoListResponse | Todo[]>(
      `/todos?due_this_week=true`,
      {
        silent: true, // Fetching operations are usually silent
      },
    );
    // Handle new API response format
    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response &&
      Array.isArray(response.data)
    ) {
      return response.data;
    }
    return response as Todo[];
  },

  getAllLabels: async (): Promise<{ name: string; count: number }[]> => {
    try {
      // Try to get labels from stats first (more efficient)
      const response = await apiService.get<TodoListResponse>(
        "/todos?include_stats=true&per_page=1",
      );

      if (response.stats?.labels) {
        return response.stats.labels;
      }

      // Fallback: fetch todos and extract labels
      if (response.data && Array.isArray(response.data)) {
        const fullResponse = await apiService.get<TodoListResponse>(
          "/todos?per_page=1000",
        );
        if (fullResponse.data && Array.isArray(fullResponse.data)) {
          const todos = fullResponse.data;
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

      const response = await apiService.get<TodoListResponse | Todo[]>(
        `/todos?${params.toString()}`,
      );
      // Handle new API response format
      if (
        typeof response === "object" &&
        response !== null &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data;
      }
      return response as Todo[];
    } catch (error) {
      console.error("Error fetching todos by label:", error);
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

      const response = await apiService.get<TodoListResponse | Todo[]>(
        `/todos?${params.toString()}`,
      );
      // Handle new API response format
      if (
        typeof response === "object" &&
        response !== null &&
        "data" in response &&
        Array.isArray(response.data)
      ) {
        return response.data;
      }
      return response as Todo[];
    } catch (error) {
      console.error("Error in semantic search:", error);
      throw error;
    }
  },

  // Generate workflow for a todo
  generateWorkflow: async (todoId: string): Promise<Todo> => {
    return apiService.post<Todo>(
      `/todos/${todoId}/workflow`,
      {},
      {
        successMessage: "Workflow generated successfully",
        errorMessage: "Failed to generate workflow",
      },
    );
  },

  // Check workflow generation status
  getWorkflowStatus: async (
    todoId: string,
  ): Promise<{
    todo_id: string;
    has_workflow: boolean;
    is_generating: boolean;
    workflow_status: WorkflowStatus;
    workflow: Workflow | null;
  }> => {
    return apiService.get(`/todos/${todoId}/workflow-status`, {
      silent: true, // Don't show success/error toasts for polling
    });
  },
};
