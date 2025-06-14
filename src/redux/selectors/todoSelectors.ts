import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "@/redux/store";

// Staleness thresholds in milliseconds
const STALENESS_THRESHOLDS = {
  todos: 60000, // 1 minute
  projects: 300000, // 5 minutes
  labels: 300000, // 5 minutes
  counts: 120000, // 2 minutes
};

// Base selectors
export const selectTodoState = (state: RootState) => state.todos;

// Data selectors
export const selectTodos = createSelector(
  selectTodoState,
  (todoState) => todoState.todos,
);

export const selectProjects = createSelector(
  selectTodoState,
  (todoState) => todoState.projects,
);

export const selectLabels = createSelector(
  selectTodoState,
  (todoState) => todoState.labels,
);

export const selectCounts = createSelector(
  selectTodoState,
  (todoState) => todoState.counts,
);

export const selectSelectedTodo = createSelector(
  selectTodoState,
  (todoState) => todoState.selectedTodo,
);

// Loading and error selectors
export const selectTodosLoading = createSelector(
  selectTodoState,
  (todoState) => todoState.loading,
);

export const selectTodosError = createSelector(
  selectTodoState,
  (todoState) => todoState.error,
);

// Pagination selectors
export const selectHasMore = createSelector(
  selectTodoState,
  (todoState) => todoState.hasMore,
);

export const selectCurrentPage = createSelector(
  selectTodoState,
  (todoState) => todoState.page,
);

// Filter selectors
export const selectFilters = createSelector(
  selectTodoState,
  (todoState) => todoState.filters,
);

// Staleness selectors
export const selectIsDataStale = createSelector(
  selectTodoState,
  (todoState) => {
    const now = Date.now();
    return {
      todos: now - todoState.lastFetch.todos > STALENESS_THRESHOLDS.todos,
      projects:
        now - todoState.lastFetch.projects > STALENESS_THRESHOLDS.projects,
      labels: now - todoState.lastFetch.labels > STALENESS_THRESHOLDS.labels,
      counts: now - todoState.lastFetch.counts > STALENESS_THRESHOLDS.counts,
    };
  },
);

// Optimistic update selectors
export const selectPendingUpdates = createSelector(
  selectTodoState,
  (todoState) => todoState.pendingUpdates,
);

export const selectPendingDeletes = createSelector(
  selectTodoState,
  (todoState) => todoState.pendingDeletes,
);

// Initial load selectors
export const selectInitialDataLoaded = createSelector(
  selectTodoState,
  (todoState) => todoState.initialDataLoaded,
);

export const selectAllInitialDataLoaded = createSelector(
  selectInitialDataLoaded,
  (loaded) => loaded.projects && loaded.labels && loaded.counts,
);

// Complex selectors
export const selectInboxProject = createSelector(
  selectProjects,
  (projects) => projects.find((p) => p.is_default) || null,
);

export const selectProjectById = (projectId: string) =>
  createSelector(selectProjects, (projects) =>
    projects.find((p) => p.id === projectId),
  );

export const selectTodoById = (todoId: string) =>
  createSelector(selectTodos, (todos) => todos.find((t) => t.id === todoId));

// Stats selectors
export const selectPendingTodosCount = createSelector(
  selectTodos,
  (todos) => todos.filter((t) => !t.completed).length,
);

export const selectCompletedTodosCount = createSelector(
  selectTodos,
  (todos) => todos.filter((t) => t.completed).length,
);

export const selectTodosByProject = (projectId: string) =>
  createSelector(selectTodos, (todos) =>
    todos.filter((t) => t.project_id === projectId),
  );

export const selectTodosByLabel = (label: string) =>
  createSelector(selectTodos, (todos) =>
    todos.filter((t) => t.labels?.includes(label)),
  );
