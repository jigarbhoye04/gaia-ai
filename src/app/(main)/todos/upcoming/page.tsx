"use client";

import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import { todoApi } from "@/features/todo/api/todoApi";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import { Todo, TodoUpdate } from "@/types/features/todoTypes";

export default function UpcomingTodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingTodos();
  }, []);

  const loadUpcomingTodos = async () => {
    setLoading(true);
    try {
      const todoList = await todoApi.getUpcomingTodos(7); // Next 7 days
      setTodos(todoList);
    } catch (error) {
      console.error("Failed to load upcoming todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    try {
      const updatedTodo = await todoApi.updateTodo(todoId, updates);
      setTodos((prev) =>
        prev.map((todo) => (todo.id === todoId ? updatedTodo : todo)),
      );
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    try {
      await todoApi.deleteTodo(todoId);
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
    } catch (error) {
      console.error("Failed to delete todo:", error);
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
    <div className="flex h-full w-full flex-col">
      <div className="w-full" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <TodoHeader title="Upcoming" todoCount={todos.length} />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onRefresh={loadUpcomingTodos}
        />
      </div>
    </div>
  );
}
