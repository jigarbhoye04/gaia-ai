import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "@/redux/store";

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

// Optimistic update selectors
export const selectPendingUpdates = createSelector(
  selectTodoState,
  (todoState) => todoState.pendingUpdates,
);

export const selectPendingDeletes = createSelector(
  selectTodoState,
  (todoState) => todoState.pendingDeletes,
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
