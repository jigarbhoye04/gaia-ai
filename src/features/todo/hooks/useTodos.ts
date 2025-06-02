import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createTodo,
  deleteTodo,
  fetchCompletedTodos,
  fetchLabels,
  fetchProjects,
  fetchTodayTodos,
  fetchTodoCounts,
  fetchTodos,
  fetchTodosByLabel,
  fetchTodosByPriority,
  fetchTodosByProject,
  fetchUpcomingTodos,
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
  TodoCreate,
  TodoFilters,
  TodoUpdate,
} from "@/types/features/todoTypes";

export const useTodos = () => {
  const dispatch = useDispatch<AppDispatch>();
  const todoState = useSelector((state: RootState) => state.todos);

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
    return dispatch(fetchTodayTodos());
  }, [dispatch]);

  const loadUpcomingTodos = useCallback(
    async (days = 7) => {
      return dispatch(fetchUpcomingTodos(days));
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
        // Refresh counts and metadata in parallel to avoid race conditions
        await Promise.all([
          dispatch(fetchTodoCounts()),
          dispatch(fetchProjects()),
          dispatch(fetchLabels()),
        ]);
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
        // Background sync - don't await these
        const needsCountRefresh =
          (updates.completed !== undefined &&
            originalTodo?.completed !== updates.completed) ||
          (updates.project_id !== undefined &&
            originalTodo?.project_id !== updates.project_id);

        if (needsCountRefresh) {
          // Fire and forget - refresh in background
          Promise.all([
            dispatch(fetchTodoCounts()),
            dispatch(fetchProjects()),
          ]).catch((error) => {
            console.error("Failed to refresh counts:", error);
          });
        }

        // Refresh labels if labels changed
        if (updates.labels !== undefined) {
          dispatch(fetchLabels()).catch((error) => {
            console.error("Failed to refresh labels:", error);
          });
        }

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
          // Refresh counts and metadata in parallel
          await Promise.all([
            dispatch(fetchTodoCounts()),
            dispatch(fetchProjects()),
            dispatch(fetchLabels()),
          ]);
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
    (todo: typeof todoState.selectedTodo) => {
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
    // Fetch all data including counts
    await Promise.all([
      dispatch(fetchProjects()),
      dispatch(fetchLabels()),
      dispatch(fetchTodoCounts()),
    ]);
  }, [dispatch]);

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
  };
};
