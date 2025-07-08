"use client";

import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import { todoApi } from "@/features/todo/api/todoApi";
import TodoDetailSheet from "@/features/todo/components/TodoDetailSheet";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import TodoModal from "@/features/todo/components/TodoModal";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { Project, Todo, TodoUpdate } from "@/types/features/todoTypes";

export default function TodayTodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const { refreshAllData } = useTodos();

  useEffect(() => {
    loadTodayTodos();
    loadProjects();
  }, []);

  const loadTodayTodos = async () => {
    setLoading(true);
    try {
      const todoList = await todoApi.getTodayTodos();
      setTodos(todoList);
    } catch (error) {
      console.error("Failed to load today's todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectList = await todoApi.getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
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
      <div className="w-full px-4">
        <TodoHeader
          title="Today"
          todoCount={todos.length}
          onAddTodo={() => setAddModalOpen(true)}
        />
      </div>

      <div className="w-full flex-1 overflow-y-auto px-4">
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={(todo) => setSelectedTodo(todo)}
          onRefresh={loadTodayTodos}
        />
      </div>

      {/* Add Todo Modal */}
      <TodoModal
        mode="add"
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          loadTodayTodos();
          refreshAllData();
        }}
      />

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        todo={selectedTodo}
        isOpen={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onUpdate={(todoId, updates) => {
          handleTodoUpdate(todoId, updates);
          setSelectedTodo((prev) => (prev ? { ...prev, ...updates } : null));
        }}
        onDelete={(todoId) => {
          handleTodoDelete(todoId);
          setSelectedTodo(null);
        }}
        projects={projects}
      />
    </div>
  );
}
