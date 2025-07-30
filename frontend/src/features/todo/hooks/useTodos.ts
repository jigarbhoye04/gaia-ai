import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createTodo,
  deleteTodo,
  fetchCompletedTodos,
  fetchLabels,
  fetchProjects,
  fetchTodoById,
  fetchTodoCounts,
  fetchTodos,
  fetchTodosByLabel,
  fetchTodosByPriority,
  fetchTodosByProject,
  optimisticDeleteTodo,
  optimisticUpdateTodo,
  resetTodos,
  revertOptimisticDelete,
  revertOptimisticUpdate,
  setFilters,
  setSelectedTodo,
  updateTodo,
} from "@/redux/slices/todoSlice";
import { AppDispatch, RootState } from "@/redux/store";
import {
  Priority,
  Todo,
  TodoCreate,
  TodoFilters,
  TodoUpdate,
} from "@/types/features/todoTypes";

export const useTodos = () => {
  const dispatch = useDispatch<AppDispatch>();
  const todoState = useSelector((state: RootState) => state.todos);
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadTodos = useCallback(
    async (filters: TodoFilters, loadMore = false) => {
      return dispatch(fetchTodos({ filters, loadMore }));
    },
    [dispatch],
  );

  const loadProjects = useCallback(async () => {
    return dispatch(fetchProjects());
  }, [dispatch]);

  const loadLabels = useCallback(async () => {
    return dispatch(fetchLabels());
  }, [dispatch]);

  const loadCounts = useCallback(async () => {
    return dispatch(fetchTodoCounts());
  }, [dispatch]);

  const loadTodayTodos = useCallback(async () => {
    // Use the main todos endpoint with today filter
    return dispatch(
      fetchTodos({ filters: { due_today: true }, loadMore: false }),
    );
  }, [dispatch]);

  const loadUpcomingTodos = useCallback(
    async (days = 7) => {
      // Use the main todos endpoint with upcoming filter
      return dispatch(
        fetchTodos({ filters: { due_this_week: true }, loadMore: false }),
      );
    },
    [dispatch],
  );

  const loadCompletedTodos = useCallback(
    async (skip = 0, limit = 50) => {
      return dispatch(fetchCompletedTodos({ skip, limit }));
    },
    [dispatch],
  );

  const loadTodosByPriority = useCallback(
    async (priority: Priority, skip = 0, limit = 50) => {
      return dispatch(fetchTodosByPriority({ priority, skip, limit }));
    },
    [dispatch],
  );

  const loadTodosByProject = useCallback(
    async (projectId: string, skip = 0, limit = 50) => {
      return dispatch(fetchTodosByProject({ projectId, skip, limit }));
    },
    [dispatch],
  );

  const loadTodosByLabel = useCallback(
    async (label: string, skip = 0, limit = 50) => {
      return dispatch(fetchTodosByLabel({ label, skip, limit }));
    },
    [dispatch],
  );

  const addTodo = useCallback(
    async (todoData: TodoCreate) => {
      const result = await dispatch(createTodo(todoData));
      if (createTodo.fulfilled.match(result)) {
        // Debounced refresh to avoid multiple rapid requests
        if (refreshDebounceRef.current) {
          clearTimeout(refreshDebounceRef.current);
        }
        refreshDebounceRef.current = setTimeout(async () => {
          await Promise.all([
            dispatch(fetchTodoCounts()),
            dispatch(fetchProjects()),
            // Only refresh labels if the new todo has labels
            ...(todoData.labels && todoData.labels.length > 0
              ? [dispatch(fetchLabels())]
              : []),
          ]);
        }, 500); // 500ms debounce
      }
      return result;
    },
    [dispatch],
  );

  const modifyTodo = useCallback(
    async (todoId: string, updates: TodoUpdate) => {
      // Find the original todo for potential rollback
      const originalTodo = todoState.todos.find((t) => t.id === todoId);

      // Apply optimistic update immediately
      dispatch(optimisticUpdateTodo({ todoId, updates }));

      try {
        const result = await dispatch(updateTodo({ todoId, updates }));
        if (!updateTodo.fulfilled.match(result)) {
          // Update failed, revert
          if (originalTodo) {
            dispatch(revertOptimisticUpdate({ todoId, originalTodo }));
          }
          return result;
        }

        // Update succeeded
        // Debounced background sync
        if (refreshDebounceRef.current) {
          clearTimeout(refreshDebounceRef.current);
        }

        refreshDebounceRef.current = setTimeout(async () => {
          const refreshTasks = [];

          // Only refresh what's needed based on the update
          const needsCountRefresh =
            (updates.completed !== undefined &&
              originalTodo?.completed !== updates.completed) ||
            (updates.project_id !== undefined &&
              originalTodo?.project_id !== updates.project_id);

          if (needsCountRefresh) {
            refreshTasks.push(dispatch(fetchTodoCounts()));

            // Only refresh projects if project was changed
            if (
              updates.project_id !== undefined &&
              originalTodo?.project_id !== updates.project_id
            ) {
              refreshTasks.push(dispatch(fetchProjects()));
            }
          }

          // Refresh labels only if labels changed
          if (
            updates.labels !== undefined &&
            JSON.stringify(originalTodo?.labels || []) !==
              JSON.stringify(updates.labels)
          ) {
            refreshTasks.push(dispatch(fetchLabels()));
          }

          if (refreshTasks.length > 0) {
            try {
              await Promise.all(refreshTasks);
            } catch (error) {
              console.error("Failed to refresh data:", error);
            }
          }
        }, 500); // 500ms debounce

        return result;
      } catch (error) {
        // Revert on error
        if (originalTodo) {
          dispatch(revertOptimisticUpdate({ todoId, originalTodo }));
        }
        throw error;
      }
    },
    [dispatch, todoState.todos],
  );

  const removeTodo = useCallback(
    async (todoId: string) => {
      // Find the original todo for potential rollback
      const originalTodo = todoState.todos.find((t) => t.id === todoId);

      // Apply optimistic delete
      dispatch(optimisticDeleteTodo(todoId));

      try {
        const result = await dispatch(deleteTodo(todoId));
        if (deleteTodo.fulfilled.match(result)) {
          // Debounced refresh after delete
          if (refreshDebounceRef.current) {
            clearTimeout(refreshDebounceRef.current);
          }
          refreshDebounceRef.current = setTimeout(async () => {
            await Promise.all([
              dispatch(fetchTodoCounts()),
              // Only refresh projects if needed (no need to always refresh)
              ...(originalTodo?.project_id ? [dispatch(fetchProjects())] : []),
              // Only refresh labels if the deleted todo had labels
              ...(originalTodo?.labels && originalTodo.labels.length > 0
                ? [dispatch(fetchLabels())]
                : []),
            ]);
          }, 500); // 500ms debounce
        } else {
          // Revert on failure
          if (originalTodo) {
            dispatch(revertOptimisticDelete(originalTodo));
          }
        }
        return result;
      } catch (error) {
        // Revert on error
        if (originalTodo) {
          dispatch(revertOptimisticDelete(originalTodo));
        }
        throw error;
      }
    },
    [dispatch, todoState.todos],
  );

  const selectTodo = useCallback(
    (todo: Todo | null) => {
      dispatch(setSelectedTodo(todo));
    },
    [dispatch],
  );

  const updateFilters = useCallback(
    (filters: TodoFilters) => {
      dispatch(setFilters(filters));
    },
    [dispatch],
  );

  const resetTodoList = useCallback(() => {
    dispatch(resetTodos());
  }, [dispatch]);

  const refreshAllData = useCallback(async () => {
    // Clear any pending debounced refreshes
    if (refreshDebounceRef.current) {
      clearTimeout(refreshDebounceRef.current);
    }

    // Always refresh all data - no caching
    await Promise.all([
      dispatch(fetchProjects()),
      dispatch(fetchLabels()),
      dispatch(fetchTodoCounts()),
    ]);
  }, [dispatch]);

  const loadTodoById = useCallback(
    async (todoId: string) => {
      // Always fetch fresh data - no caching
      return dispatch(fetchTodoById(todoId));
    },
    [dispatch],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, []);

  return {
    // State
    todos: todoState.todos,
    projects: todoState.projects,
    labels: todoState.labels,
    selectedTodo: todoState.selectedTodo,
    counts: todoState.counts,
    loading: todoState.loading,
    error: todoState.error,
    hasMore: todoState.hasMore,

    // Actions
    loadTodos,
    loadProjects,
    loadLabels,
    loadCounts,
    loadTodayTodos,
    loadUpcomingTodos,
    loadCompletedTodos,
    loadTodosByPriority,
    loadTodosByProject,
    loadTodosByLabel,
    addTodo,
    modifyTodo,
    removeTodo,
    selectTodo,
    updateFilters,
    resetTodoList,
    refreshAllData,
    loadTodoById,
  };
};
