import { useCallback } from "react";
import { useDispatch,useSelector } from "react-redux";

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
  resetTodos,
  setFilters,
  setSelectedTodo,
  updateTodo,
} from "@/redux/slices/todoSlice";
import { AppDispatch,RootState } from "@/redux/store";
import {
  Priority,
  TodoCreate,
  TodoFilters,
  TodoUpdate,
} from "@/types/todoTypes";

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
        // Also refresh counts after creating
        dispatch(fetchTodoCounts());
        dispatch(fetchProjects());
        dispatch(fetchLabels());
      }
      return result;
    },
    [dispatch],
  );

  const modifyTodo = useCallback(
    async (todoId: string, updates: TodoUpdate) => {
      const result = await dispatch(updateTodo({ todoId, updates }));
      if (updateTodo.fulfilled.match(result)) {
        // Refresh counts after updating
        dispatch(fetchTodoCounts());
      }
      return result;
    },
    [dispatch],
  );

  const removeTodo = useCallback(
    async (todoId: string) => {
      const result = await dispatch(deleteTodo(todoId));
      if (deleteTodo.fulfilled.match(result)) {
        // Refresh counts after deleting
        dispatch(fetchTodoCounts());
        dispatch(fetchProjects());
        dispatch(fetchLabels());
      }
      return result;
    },
    [dispatch],
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
