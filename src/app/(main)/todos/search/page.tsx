"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import Spinner from "@/components/ui/spinner";
import { TodoService } from "@/services/todoService";
import { Todo, TodoUpdate } from "@/types/todoTypes";

export default function SearchTodosPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (query) {
      searchTodos();
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [query]);

  const searchTodos = async () => {
    setLoading(true);
    try {
      const results = await TodoService.searchTodos(query);
      setTodos(results);
    } catch (error) {
      console.error("Failed to search todos:", error);
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
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ minWidth: "500px" }}>
      <TodoHeader
        title={query ? `Search Results for "${query}"` : "Search"}
        todoCount={todos.length}
        selectedCount={selectedTodos.size}
        onSelectAll={handleSelectAll}
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        allSelected={selectedTodos.size === todos.length && todos.length > 0}
      />

      <div
        className="min-w-5xl flex-1 overflow-y-auto"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        {!query ? (
          <div className="flex h-64 flex-col items-center justify-center text-foreground-500">
            <p className="text-lg">Enter a search query to find tasks</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-foreground-500">
            <p className="mb-2 text-lg">No tasks found for "{query}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <TodoList
            todos={todos}
            onTodoUpdate={handleTodoUpdate}
            onTodoDelete={handleTodoDelete}
          />
        )}
      </div>
    </div>
  );
}
