"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import TodoDetailSheet from "@/components/Todo/TodoDetailSheet";
import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import Spinner from "@/components/ui/spinner";
import { useTodos } from "@/hooks/useTodos";
import { Priority, TodoFilters, TodoUpdate } from "@/types/todoTypes";

export default function TodosPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(0);

  const {
    todos,
    projects,
    selectedTodo,
    loading,
    hasMore,
    loadTodos,
    modifyTodo,
    removeTodo,
    selectTodo,
  } = useTodos();

  // Get filter from URL params
  const projectId = searchParams.get("project");
  const priority = searchParams.get("priority");
  const completedParam = searchParams.get("completed");
  const completed = completedParam === "true";

  // Helper function to validate priority value
  const getPriorityFilter = (
    priorityString: string | null,
  ): Priority | undefined => {
    if (!priorityString) return undefined;
    return Object.values(Priority).includes(priorityString as Priority)
      ? (priorityString as Priority)
      : undefined;
  };

  useEffect(() => {
    const filters: TodoFilters = {
      project_id: projectId || undefined,
      priority: getPriorityFilter(priority),
    };

    // Handle completed filter
    if (completedParam !== null) {
      filters.completed = completed;
    } else if (!projectId && !priority) {
      // Default to showing only non-completed todos in inbox
      filters.completed = false;
    }

    // Default to inbox project if no project specified
    if (!projectId && !priority) {
      const inboxProject = projects.find((p) => p.is_default);
      if (inboxProject) {
        filters.project_id = inboxProject.id;
      }
    }

    loadTodos(filters, false);
    setPage(0);
  }, [projectId, priority, completed, completedParam, loadTodos, projects]);

  const handleLoadMore = () => {
    const filters: TodoFilters = {
      project_id: projectId || undefined,
      priority: getPriorityFilter(priority),
    };

    // Handle completed filter
    if (completedParam !== null) {
      filters.completed = completed;
    } else if (!projectId && !priority) {
      filters.completed = false;
    }

    // Default to inbox project if needed
    if (!projectId && !priority) {
      const inboxProject = projects.find((p) => p.is_default);
      if (inboxProject) {
        filters.project_id = inboxProject.id;
      }
    }

    loadTodos(filters, true);
    setPage((prev) => prev + 1);
  };

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    await modifyTodo(todoId, updates);
  };

  const handleTodoDelete = async (todoId: string) => {
    await removeTodo(todoId);
  };

  if (loading && todos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-screen max-w-5xl flex-col">
      <TodoHeader title={getPageTitle()} todoCount={todos.length} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (
            hasMore &&
            !loading &&
            target.scrollHeight - target.scrollTop <= target.clientHeight + 100
          ) {
            handleLoadMore();
          }
        }}
      >
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={(todo) => selectTodo(todo)}
          onRefresh={() => {
            const filters: TodoFilters = {
              project_id: projectId || undefined,
              priority: getPriorityFilter(priority),
            };

            if (completedParam !== null) {
              filters.completed = completed;
            } else if (!projectId && !priority) {
              filters.completed = false;
            }

            if (!projectId && !priority) {
              const inboxProject = projects.find((p) => p.is_default);
              if (inboxProject) {
                filters.project_id = inboxProject.id;
              }
            }

            loadTodos(filters, false);
          }}
        />
      </div>

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        todo={selectedTodo}
        isOpen={!!selectedTodo}
        onClose={() => selectTodo(null)}
        onUpdate={handleTodoUpdate}
        onDelete={handleTodoDelete}
        projects={projects}
      />
    </div>
  );

  function getPageTitle() {
    if (projectId) return "Project Tasks";
    if (priority)
      return `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`;
    if (completed) return "Completed Tasks";
    return "Inbox";
  }
}
