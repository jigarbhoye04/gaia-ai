"use client";

import { Spinner } from "@heroui/spinner";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import { TodoService } from "@/services/todoService";
import { Priority, Todo, TodoFilters, TodoUpdate } from "@/types/todoTypes";

export default function TodosPage() {
  const searchParams = useSearchParams();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  // Get filter from URL params
  const projectId = searchParams.get("project");
  const priority = searchParams.get("priority");
  const completed = searchParams.get("completed") === "true";

  useEffect(() => {
    loadTodos();
  }, [projectId, priority, completed]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const filters: TodoFilters = {};

      // Default to inbox if no project specified
      if (!projectId && !priority && !completed) {
        // This will show inbox todos
        filters.project_id = undefined;
      } else {
        if (projectId) filters.project_id = projectId;
        if (priority) filters.priority = priority as Priority;
        if (completed) filters.completed = true;
      }

      const todoList = await TodoService.getAllTodos(filters);
      setTodos(todoList);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    try {
      const updatedTodo = await TodoService.updateTodo(todoId, updates);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === todoId ? updatedTodo : todo)),
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    try {
      await TodoService.deleteTodo(todoId);
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      selectedTodos.delete(todoId);
      setSelectedTodos(new Set(selectedTodos));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.size === 0) return;

    try {
      const todoIds = Array.from(selectedTodos);
      const updatedTodos = await TodoService.bulkCompleteTodos(todoIds);

      // Update local state
      setTodos((prev) =>
        prev.map((todo) => {
          const updated = updatedTodos.find((t) => t.id === todo.id);
          return updated || todo;
        }),
      );

      setSelectedTodos(new Set());
    } catch (error) {
      console.error("Failed to complete todos:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.size === 0) return;

    try {
      const todoIds = Array.from(selectedTodos);
      await TodoService.bulkDeleteTodos(todoIds);

      // Remove from local state
      setTodos((prev) => prev.filter((todo) => !selectedTodos.has(todo.id)));
      setSelectedTodos(new Set());
    } catch (error) {
      console.error("Failed to delete todos:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === todos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(todos.map((t) => t.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ minWidth: "500px" }}>
      <TodoHeader
        title={getPageTitle()}
        todoCount={todos.length}
        selectedCount={selectedTodos.size}
        onSelectAll={handleSelectAll}
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        allSelected={selectedTodos.size === todos.length && todos.length > 0}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <TodoList
          todos={todos}
          selectedTodos={selectedTodos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoSelect={(todoId) => {
            const newSelected = new Set(selectedTodos);
            if (newSelected.has(todoId)) {
              newSelected.delete(todoId);
            } else {
              newSelected.add(todoId);
            }
            setSelectedTodos(newSelected);
          }}
          onRefresh={loadTodos}
        />
      </div>
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
