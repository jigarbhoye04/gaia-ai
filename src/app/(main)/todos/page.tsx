"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import TodoDetailSheet from "@/features/todo/components/TodoDetailSheet";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import TodoModal from "@/features/todo/components/TodoModal";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { Priority, TodoFilters, TodoUpdate } from "@/types/features/todoTypes";

export default function TodosPage() {
  const searchParams = useSearchParams();
  const [_page, setPage] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);

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
    <div className="flex h-full w-full flex-col">
      <div className="w-full px-4">
        <TodoHeader
          title={getPageTitle()}
          todoCount={todos.length}
          onAddTodo={() => setAddModalOpen(true)}
        />
      </div>

      <div
        className="w-full flex-1 overflow-y-auto px-4"
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

      {/* Add Todo Modal */}
      <TodoModal
        mode="add"
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        initialProjectId={projectId || undefined}
      />

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
