import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { todoApi } from "@/features/todo/api/todoApi";
import {
  Priority,
  Project,
  Todo,
  TodoCreate,
  TodoFilters,
  TodoUpdate,
} from "@/types/features/todoTypes";

interface TodoState {
  todos: Todo[];
  projects: Project[];
  labels: { name: string; count: number }[];
  selectedTodo: Todo | null;
  counts: {
    inbox: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  filters: TodoFilters;
  // Optimistic update tracking
  pendingUpdates: Record<string, TodoUpdate>;
  pendingDeletes: string[];
  // Pagination metadata
  totalCount: number;
  // Initial data loading states
  initialDataLoaded: {
    projects: boolean;
    labels: boolean;
    counts: boolean;
  };
  // Cache timestamps for smart invalidation
  lastFetch: {
    todos: number;
    projects: number;
    labels: number;
    counts: number;
  };
}

const initialState: TodoState = {
  todos: [],
  projects: [],
  labels: [],
  selectedTodo: null,
  counts: {
    inbox: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  },
  loading: false,
  error: null,
  hasMore: true,
  page: 0,
  filters: {},
  pendingUpdates: {},
  pendingDeletes: [],
  totalCount: 0,
  initialDataLoaded: {
    projects: false,
    labels: false,
    counts: false,
  },
  lastFetch: {
    todos: 0,
    projects: 0,
    labels: 0,
    counts: 0,
  },
};

// Async thunks
export const fetchTodos = createAsyncThunk(
  "todos/fetchTodos",
  async (
    { filters, loadMore = false }: { filters: TodoFilters; loadMore?: boolean },
    { getState },
  ) => {
    const state = getState() as { todos: TodoState };
    const skip = loadMore ? state.todos.page * 50 : 0;
    const todos = await todoApi.getAllTodos({
      ...filters,
      skip,
      limit: 50,
    });
    return { todos, loadMore };
  },
);

export const fetchProjects = createAsyncThunk(
  "todos/fetchProjects",
  async () => {
    return await todoApi.getAllProjects();
  },
);

export const fetchLabels = createAsyncThunk("todos/fetchLabels", async () => {
  return await todoApi.getAllLabels();
});

export const fetchTodoCounts = createAsyncThunk(
  "todos/fetchCounts",
  async () => {
    // Use the new optimized counts endpoint
    return await todoApi.getTodoCounts();
  },
);

export const createTodo = createAsyncThunk(
  "todos/create",
  async (todoData: TodoCreate) => {
    const todo = await todoApi.createTodo(todoData);
    return todo;
  },
);

export const updateTodo = createAsyncThunk(
  "todos/update",
  async ({ todoId, updates }: { todoId: string; updates: TodoUpdate }) => {
    const todo = await todoApi.updateTodo(todoId, updates);
    return todo;
  },
);

export const deleteTodo = createAsyncThunk(
  "todos/delete",
  async (todoId: string) => {
    await todoApi.deleteTodo(todoId);
    return todoId;
  },
);

export const fetchCompletedTodos = createAsyncThunk(
  "todos/fetchCompleted",
  async ({ skip = 0, limit = 50 }: { skip?: number; limit?: number }) => {
    return await todoApi.getAllTodos({ completed: true, skip, limit });
  },
);

export const fetchTodosByPriority = createAsyncThunk(
  "todos/fetchByPriority",
  async ({
    priority,
    skip = 0,
    limit = 50,
  }: {
    priority: Priority;
    skip?: number;
    limit?: number;
  }) => {
    return await todoApi.getAllTodos({ priority, skip, limit });
  },
);

export const fetchTodosByProject = createAsyncThunk(
  "todos/fetchByProject",
  async ({
    projectId,
    skip = 0,
    limit = 50,
  }: {
    projectId: string;
    skip?: number;
    limit?: number;
  }) => {
    return await todoApi.getAllTodos({
      project_id: projectId,
      skip,
      limit,
    });
  },
);

export const fetchTodosByLabel = createAsyncThunk(
  "todos/fetchByLabel",
  async ({
    label,
    skip = 0,
    limit = 50,
  }: {
    label: string;
    skip?: number;
    limit?: number;
  }) => {
    return await todoApi.getTodosByLabel(label, skip, limit);
  },
);

export const fetchTodoById = createAsyncThunk(
  "todos/fetchTodoById",
  async (todoId: string, { getState }) => {
    const state = getState() as { todos: TodoState };

    // Check if todo already exists in state and is fresh (less than 5 minutes old)
    const existingTodo = state.todos.todos.find((t) => t.id === todoId);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    if (existingTodo && state.todos.lastFetch.todos > fiveMinutesAgo) {
      // Return existing todo without making API call
      return existingTodo;
    }

    // Fetch from API if not in state or stale
    return await todoApi.getTodo(todoId);
  },
);

// Redux slice
const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    setSelectedTodo: (state, action: PayloadAction<Todo | null>) => {
      state.selectedTodo = action.payload;
    },
    setFilters: (state, action: PayloadAction<TodoFilters>) => {
      state.filters = action.payload;
      state.page = 0;
    },
    resetTodos: (state) => {
      state.todos = [];
      state.page = 0;
      state.hasMore = true;
    },
    refreshAllData: (state) => {
      // This will trigger a refresh by components watching the state
      // Don't reset initialDataLoaded flags to avoid showing empty states
      state.loading = true;
    },
    // Optimistic update actions
    optimisticUpdateTodo: (
      state,
      action: PayloadAction<{ todoId: string; updates: TodoUpdate }>,
    ) => {
      const { todoId, updates } = action.payload;
      const index = state.todos.findIndex((t) => t.id === todoId);
      if (index !== -1) {
        const oldTodo = state.todos[index];
        const updatedTodo = { ...oldTodo, ...updates };
        state.todos[index] = updatedTodo;
        state.pendingUpdates[todoId] = updates;

        // Update selected todo if it's the same
        if (state.selectedTodo?.id === todoId) {
          state.selectedTodo = updatedTodo;
        }

        // Optimistically update counts for completion status change
        if (
          updates.completed !== undefined &&
          oldTodo.completed !== updates.completed
        ) {
          if (updates.completed) {
            // todo marked as completed
            state.counts.completed += 1;

            // Decrease counts based on todo properties
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (oldTodo.due_date) {
              const dueDate = new Date(oldTodo.due_date);
              dueDate.setHours(0, 0, 0, 0);

              if (dueDate.getTime() === today.getTime()) {
                state.counts.today = Math.max(0, state.counts.today - 1);
              } else if (
                dueDate > today &&
                dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              ) {
                state.counts.upcoming = Math.max(0, state.counts.upcoming - 1);
              }
            }

            // Decrease inbox count if in default project
            const inboxProject = state.projects.find((p) => p.is_default);
            if (inboxProject && oldTodo.project_id === inboxProject.id) {
              state.counts.inbox = Math.max(0, state.counts.inbox - 1);
            }
          } else {
            // todo marked as incomplete
            state.counts.completed = Math.max(0, state.counts.completed - 1);

            // Increase counts based on todo properties
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (oldTodo.due_date) {
              const dueDate = new Date(oldTodo.due_date);
              dueDate.setHours(0, 0, 0, 0);

              if (dueDate.getTime() === today.getTime()) {
                state.counts.today += 1;
              } else if (
                dueDate > today &&
                dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              ) {
                state.counts.upcoming += 1;
              }
            }

            // Increase inbox count if in default project
            const inboxProject = state.projects.find((p) => p.is_default);
            if (inboxProject && oldTodo.project_id === inboxProject.id) {
              state.counts.inbox += 1;
            }
          }
        }
      }
    },
    optimisticDeleteTodo: (state, action: PayloadAction<string>) => {
      const todoId = action.payload;
      state.todos = state.todos.filter((t) => t.id !== todoId);
      state.pendingDeletes.push(todoId);
    },
    revertOptimisticUpdate: (
      state,
      action: PayloadAction<{ todoId: string; originalTodo: Todo }>,
    ) => {
      const { todoId, originalTodo } = action.payload;
      const index = state.todos.findIndex((t) => t.id === todoId);
      if (index !== -1) {
        const currentTodo = state.todos[index];
        state.todos[index] = originalTodo;

        // Revert selected todo if it's the same
        if (state.selectedTodo?.id === todoId) {
          state.selectedTodo = originalTodo;
        }

        // Revert count changes if completion status was changed
        if (currentTodo.completed !== originalTodo.completed) {
          if (currentTodo.completed && !originalTodo.completed) {
            // Was marked complete, now reverting to incomplete
            state.counts.completed = Math.max(0, state.counts.completed - 1);

            // Restore counts based on todo properties
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (originalTodo.due_date) {
              const dueDate = new Date(originalTodo.due_date);
              dueDate.setHours(0, 0, 0, 0);

              if (dueDate.getTime() === today.getTime()) {
                state.counts.today += 1;
              } else if (
                dueDate > today &&
                dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              ) {
                state.counts.upcoming += 1;
              }
            }

            // Restore inbox count if in default project
            const inboxProject = state.projects.find((p) => p.is_default);
            if (inboxProject && originalTodo.project_id === inboxProject.id) {
              state.counts.inbox += 1;
            }
          } else if (!currentTodo.completed && originalTodo.completed) {
            // Was marked incomplete, now reverting to complete
            state.counts.completed += 1;

            // Restore counts based on todo properties
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (originalTodo.due_date) {
              const dueDate = new Date(originalTodo.due_date);
              dueDate.setHours(0, 0, 0, 0);

              if (dueDate.getTime() === today.getTime()) {
                state.counts.today = Math.max(0, state.counts.today - 1);
              } else if (
                dueDate > today &&
                dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              ) {
                state.counts.upcoming = Math.max(0, state.counts.upcoming - 1);
              }
            }

            // Restore inbox count if in default project
            const inboxProject = state.projects.find((p) => p.is_default);
            if (inboxProject && originalTodo.project_id === inboxProject.id) {
              state.counts.inbox = Math.max(0, state.counts.inbox - 1);
            }
          }
        }
      }
      delete state.pendingUpdates[todoId];
    },
    revertOptimisticDelete: (state, action: PayloadAction<Todo>) => {
      const todo = action.payload;
      state.todos.push(todo);
      state.pendingDeletes = state.pendingDeletes.filter(
        (id) => id !== todo.id,
      );
    },
    clearPendingUpdate: (state, action: PayloadAction<string>) => {
      delete state.pendingUpdates[action.payload];
    },
    clearPendingDelete: (state, action: PayloadAction<string>) => {
      state.pendingDeletes = state.pendingDeletes.filter(
        (id) => id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch todos
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        const { todos, loadMore } = action.payload;
        if (loadMore) {
          state.todos = [...state.todos, ...todos];
          state.page += 1;
        } else {
          state.todos = todos;
          state.page = 0;
        }
        // Better pagination logic - check if we got less than requested
        state.hasMore = todos.length >= 50;
        state.totalCount = loadMore ? state.totalCount : todos.length;
        state.loading = false;
        state.lastFetch.todos = Date.now();
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch todos";
      });

    // Fetch projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.initialDataLoaded.projects = true;
        state.lastFetch.projects = Date.now();
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch projects";
      });

    // Fetch labels
    builder
      .addCase(fetchLabels.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        state.labels = action.payload;
        state.initialDataLoaded.labels = true;
        state.lastFetch.labels = Date.now();
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.error = action.error.message || "Failed to fetch labels";
      });

    // Fetch counts
    builder
      .addCase(fetchTodoCounts.fulfilled, (state, action) => {
        state.counts = action.payload;
        state.initialDataLoaded.counts = true;
        state.lastFetch.counts = Date.now();
      })
      .addCase(fetchTodoCounts.rejected, (_state, action) => {
        console.error("Failed to fetch counts:", action.error.message);
      });

    // Create todo
    builder.addCase(createTodo.fulfilled, (state, action) => {
      const newTodo = action.payload;

      // Add to todos list if it matches current filters
      if (shouldIncludeTodo(newTodo, state.filters)) {
        state.todos.unshift(newTodo);
      }

      // Update project count
      const project = state.projects.find((p) => p.id === newTodo.project_id);
      if (project) {
        project.todo_count += 1;
      }

      // Update label counts only for non-completed todos
      if (!newTodo.completed) {
        updateLabelCounts(state, newTodo.labels, []);
      }
    });

    // Update todo
    builder
      .addCase(updateTodo.pending, (state, _action) => {
        state.error = null;
        // Don't clear pending updates here - wait for fulfilled
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        const updatedTodo = action.payload;
        const todoId = updatedTodo.id;
        const index = state.todos.findIndex((t) => t.id === todoId);

        if (index !== -1) {
          const oldTodo = state.todos[index];

          // Apply the server response
          state.todos[index] = updatedTodo;

          // Clear any pending updates for this todo
          delete state.pendingUpdates[todoId];

          // Update selected todo if it's the same
          if (state.selectedTodo?.id === updatedTodo.id) {
            state.selectedTodo = updatedTodo;
          }

          // Update project counts if project changed or completion status changed
          if (
            oldTodo.project_id !== updatedTodo.project_id ||
            oldTodo.completed !== updatedTodo.completed
          ) {
            // Handle old project
            if (oldTodo.project_id) {
              const oldProject = state.projects.find(
                (p) => p.id === oldTodo.project_id,
              );
              if (oldProject && oldTodo.project_id !== updatedTodo.project_id) {
                oldProject.todo_count = Math.max(0, oldProject.todo_count - 1);
              }
            }

            // Handle new project
            if (
              updatedTodo.project_id &&
              oldTodo.project_id !== updatedTodo.project_id
            ) {
              const newProject = state.projects.find(
                (p) => p.id === updatedTodo.project_id,
              );
              if (newProject) {
                newProject.todo_count += 1;
              }
            }
          }

          // Update label counts if labels changed
          const oldLabels = oldTodo.labels || [];
          const newLabels = updatedTodo.labels || [];
          if (
            JSON.stringify(oldLabels.sort()) !==
            JSON.stringify(newLabels.sort())
          ) {
            updateLabelCounts(state, newLabels, oldLabels);
          }
        }
      })
      .addCase(updateTodo.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update todo";
      });

    // Delete todo
    builder
      .addCase(deleteTodo.fulfilled, (state, action) => {
        const todoId = action.payload;
        const todoIndex = state.todos.findIndex((t) => t.id === todoId);

        if (todoIndex !== -1) {
          const todo = state.todos[todoIndex];
          state.todos.splice(todoIndex, 1);

          // Update project count
          const project = state.projects.find((p) => p.id === todo.project_id);
          if (project) {
            project.todo_count = Math.max(0, project.todo_count - 1);
          }

          // Update label counts only if todo was not completed
          if (!todo.completed) {
            updateLabelCounts(state, [], todo.labels);
          }

          // Clear selected todo if it was deleted
          if (state.selectedTodo?.id === todoId) {
            state.selectedTodo = null;
          }
        }
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete todo";
      });

    // Handle completed todos
    builder
      .addCase(fetchCompletedTodos.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCompletedTodos.fulfilled, (state, action) => {
        state.todos = action.payload;
        state.loading = false;
        state.hasMore = action.payload.length === 50;
      })
      .addCase(fetchCompletedTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch completed todos";
      });

    // Handle priority todos
    builder
      .addCase(fetchTodosByPriority.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodosByPriority.fulfilled, (state, action) => {
        state.todos = action.payload;
        state.loading = false;
        state.hasMore = action.payload.length === 50;
      });

    // Handle project todos
    builder
      .addCase(fetchTodosByProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodosByProject.fulfilled, (state, action) => {
        state.todos = action.payload;
        state.loading = false;
        state.hasMore = action.payload.length === 50;
      });

    // Handle label todos
    builder
      .addCase(fetchTodosByLabel.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodosByLabel.fulfilled, (state, action) => {
        state.todos = action.payload;
        state.loading = false;
        state.hasMore = action.payload.length === 50;
      })
      // Handle fetch todo by ID
      .addCase(fetchTodoById.fulfilled, (state, action) => {
        const todo = action.payload;
        // Add or update the todo in the list if it doesn't exist
        const existingIndex = state.todos.findIndex((t) => t.id === todo.id);
        if (existingIndex !== -1) {
          state.todos[existingIndex] = todo;
        } else {
          state.todos.unshift(todo);
        }
        // Set as selected todo
        state.selectedTodo = todo;
      });
  },
});

// Helper function to check if a todo should be included based on filters
function shouldIncludeTodo(todo: Todo, filters: TodoFilters): boolean {
  if (filters.completed !== undefined && todo.completed !== filters.completed) {
    return false;
  }
  if (
    filters.project_id !== undefined &&
    todo.project_id !== filters.project_id
  ) {
    return false;
  }
  if (filters.priority && todo.priority !== filters.priority) {
    return false;
  }
  return true;
}

// Helper function to update label counts (only for non-completed todos)
function updateLabelCounts(
  state: TodoState,
  addLabels: string[],
  removeLabels: string[],
) {
  // Remove counts for old labels
  removeLabels.forEach((label) => {
    const existingLabel = state.labels.find((l) => l.name === label);
    if (existingLabel && existingLabel.count > 0) {
      existingLabel.count = Math.max(0, existingLabel.count - 1);
      // Remove label if count reaches 0
      if (existingLabel.count === 0) {
        state.labels = state.labels.filter((l) => l.name !== label);
      }
    }
  });

  // Add counts for new labels
  addLabels.forEach((label) => {
    const existingLabel = state.labels.find((l) => l.name === label);
    if (existingLabel) {
      existingLabel.count += 1;
    } else {
      state.labels.push({ name: label, count: 1 });
    }
  });

  // Sort labels by count (descending) and then by name
  state.labels.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name);
  });
}

export const {
  setSelectedTodo,
  setFilters,
  resetTodos,
  refreshAllData,
  optimisticUpdateTodo,
  optimisticDeleteTodo,
  revertOptimisticUpdate,
  revertOptimisticDelete,
  clearPendingUpdate,
  clearPendingDelete,
} = todoSlice.actions;
export default todoSlice.reducer;
