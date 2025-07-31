"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import TodoDetailSheet from "@/features/todo/components/TodoDetailSheet";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import TodoModal from "@/features/todo/components/TodoModal";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { useUrlTodoSelection } from "@/features/todo/hooks/useUrlTodoSelection";
import {
  Priority,
  Todo,
  TodoFilters,
  TodoUpdate,
} from "@/types/features/todoTypes";

export default function TodosPage() {
  const searchParams = useSearchParams();
  const [_page, setPage] = useState(0);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const { selectedTodoId, selectTodo, clearSelection } = useUrlTodoSelection();

  const {
    todos,
    projects,
    loading,
    hasMore,
    loadTodos,
    modifyTodo,
    removeTodo,
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
    const filters: TodoFilters = {};

    // Only add filters if they are explicitly specified in URL
    if (projectId) {
      filters.project_id = projectId;
    }

    if (priority) {
      const priorityValue = getPriorityFilter(priority);
      if (priorityValue) {
        filters.priority = priorityValue;
      }
    }

    // Handle completed filter only if explicitly set
    if (completedParam !== null) {
      filters.completed = completed;
    }

    // Let the backend handle default inbox behavior when no filters are specified
    loadTodos(filters, false);
    setPage(0);
  }, [projectId, priority, completed, completedParam, loadTodos]);

  const handleLoadMore = () => {
    const filters: TodoFilters = {};

    // Only add filters if they are explicitly specified in URL
    if (projectId) {
      filters.project_id = projectId;
    }

    if (priority) {
      const priorityValue = getPriorityFilter(priority);
      if (priorityValue) {
        filters.priority = priorityValue;
      }
    }

    // Handle completed filter only if explicitly set
    if (completedParam !== null) {
      filters.completed = completed;
    }

    loadTodos(filters, true);
    setPage((prev) => prev + 1);
  };

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    await modifyTodo(todoId, updates);
  };

  const handleTodoDelete = async (todoId: string) => {
    await removeTodo(todoId);
    // If the deleted todo was selected (shown in URL), close the detail sheet
    if (selectedTodoId === todoId) {
      clearSelection();
    }
  };

  const handleTodoEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditModalOpen(true);
  };

  if (loading && todos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const incompleteTodos = todos.filter((t) => !t.completed);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full px-4">
        <TodoHeader
          title={getPageTitle()}
          todoCount={incompleteTodos.length}
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
          onTodoEdit={handleTodoEdit}
          onTodoClick={(todo) => selectTodo(todo.id)}
          onRefresh={() => {
            const filters: TodoFilters = {};

            // Only add filters if they are explicitly specified in URL
            if (projectId) {
              filters.project_id = projectId;
            }

            if (priority) {
              const priorityValue = getPriorityFilter(priority);
              if (priorityValue) {
                filters.priority = priorityValue;
              }
            }

            // Handle completed filter only if explicitly set
            if (completedParam !== null) {
              filters.completed = completed;
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

      {/* Edit Todo Modal */}
      <TodoModal
        mode="edit"
        todo={editingTodo || undefined}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditModalOpen(false);
          setEditingTodo(null);
        }}
      />

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        todo={
          selectedTodoId
            ? todos.find((t) => t.id === selectedTodoId) || null
            : null
        }
        isOpen={!!selectedTodoId}
        onClose={clearSelection}
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
