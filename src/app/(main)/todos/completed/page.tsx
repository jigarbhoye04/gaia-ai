"use client";

import { useEffect } from "react";

import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import Spinner from "@/components/ui/spinner";
import { useTodos } from "@/hooks/useTodos";
import { TodoUpdate } from "@/types/todoTypes";

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
    <div className="flex h-full flex-col">
      <TodoHeader title="Completed" todoCount={todos.length} />

      <div className="flex-1 overflow-y-auto">
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
