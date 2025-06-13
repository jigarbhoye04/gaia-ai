"use client";

import { useEffect } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { TodoUpdate } from "@/types/features/todoTypes";

export default function CompletedTodosPage() {
  const { todos, loading, loadCompletedTodos, modifyTodo, removeTodo } =
    useTodos();

  useEffect(() => {
    loadCompletedTodos();
  }, [loadCompletedTodos]);

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    await modifyTodo(todoId, updates);

    // If todo was marked incomplete, reload the list
    if (updates.completed === false) {
      await loadCompletedTodos();
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    await removeTodo(todoId);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="w-full" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <TodoHeader title="Completed" todoCount={todos.length} />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onRefresh={() => loadCompletedTodos()}
        />
      </div>
    </div>
  );
}
