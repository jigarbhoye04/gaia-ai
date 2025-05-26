"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import EnhancedTodoSearchBar from "@/components/Todo/EnhancedTodoSearchBar";
import TodoHeader from "@/components/Todo/TodoHeader";
import { TodoService } from "@/services/todoService";
import { Todo, TodoUpdate } from "@/types/todoTypes";

export default function SearchTodosPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  // The EnhancedTodoSearchBar will handle its own search state
  // We only need to track selected todos for bulk operations

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    try {
      await TodoService.updateTodo(todoId, updates);
      // Todo update is handled by the search bar component
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    try {
      await TodoService.deleteTodo(todoId);
      selectedTodos.delete(todoId);
      setSelectedTodos(new Set(selectedTodos));
      // Todo deletion is handled by the search bar component
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    // Handle todo click if needed
    console.log("Todo clicked:", todo);
  };

  const handleBulkComplete = async () => {
    if (selectedTodos.size === 0) return;

    try {
      const todoIds = Array.from(selectedTodos);
      await TodoService.bulkCompleteTodos(todoIds);
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
      await TodoService.bulkDeleteTodos(todoIds);
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
    <div className="flex h-full flex-col" style={{ minWidth: "500px" }}>
      <TodoHeader
        title="Search Tasks"
        todoCount={0} // Count will be shown in search results
        selectedCount={selectedTodos.size}
        onSelectAll={handleSelectAll}
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        allSelected={false}
      />

      <div
        className="min-w-5xl flex-1 overflow-y-auto p-4"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* Enhanced Search Bar with integrated results */}
        <EnhancedTodoSearchBar
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={handleTodoClick}
          initialQuery={initialQuery} // Pass initial query from URL
        />

        {/* Help Text */}
        <div className="text-muted-foreground mt-8 text-center">
          <h3 className="mb-2 text-lg font-medium">Search Your Tasks</h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Traditional Search:</strong> Find tasks by title and
              description
            </p>
            <p>
              <strong>AI Search:</strong> Use natural language like "urgent
              tasks for next week"
            </p>
            <p>
              <strong>Smart Search:</strong> Combines both approaches for
              comprehensive results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
