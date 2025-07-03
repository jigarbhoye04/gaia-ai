"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { todoApi } from "@/features/todo/api/todoApi";
import EnhancedTodoSearchBar from "@/features/todo/components/EnhancedTodoSearchBar";
import TodoHeader from "@/features/todo/components/TodoHeader";
import { Todo, TodoUpdate } from "@/types/features/todoTypes";

export default function SearchTodosPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  // The EnhancedTodoSearchBar will handle its own search state
  // We only need to track selected todos for bulk operations

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    try {
      await todoApi.updateTodo(todoId, updates);
      // todo update is handled by the search bar component
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    try {
      await todoApi.deleteTodo(todoId);
      selectedTodos.delete(todoId);
      setSelectedTodos(new Set(selectedTodos));
      // todo deletion is handled by the search bar component
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    // Handle todo click if needed
    console.log("todo clicked:", todo);
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.size === 0) return;

    try {
      const todoIds = Array.from(selectedTodos);
      await todoApi.bulkCompleteTodos(todoIds);
      setSelectedTodos(new Set());
      // Refresh search results will be handled by the search bar
    } catch (error) {
      console.error("Failed to complete todos:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.size === 0) return;

    try {
      const todoIds = Array.from(selectedTodos);
      await todoApi.bulkDeleteTodos(todoIds);
      setSelectedTodos(new Set());
      // Refresh search results will be handled by the search bar
    } catch (error) {
      console.error("Failed to delete todos:", error);
    }
  };

  const handleSelectAll = () => {
    // This will be handled by the search bar component if needed
    // For now, we'll keep this functionality for bulk operations
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <TodoHeader
          title="Search Tasks"
          todoCount={0} // Count will be shown in search results
          selectedCount={selectedTodos.size}
          onSelectAll={handleSelectAll}
          onBulkComplete={handleBulkComplete}
          onBulkDelete={handleBulkDelete}
          allSelected={false}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        {/* Enhanced search Bar with integrated results */}
        <EnhancedTodoSearchBar
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={handleTodoClick}
          initialQuery={initialQuery} // Pass initial query from URL
        />
      </div>
    </div>
  );
}
