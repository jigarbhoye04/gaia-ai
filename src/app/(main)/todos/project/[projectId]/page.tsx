"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import { todoApi } from "@/features/todo/api/todoApi";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import {
  Project,
  Todo,
  TodoFilters,
  TodoUpdate,
} from "@/types/features/todoTypes";

export default function ProjectTodosPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [todos, setTodos] = useState<Todo[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Load project details
      const projects = await todoApi.getAllProjects();
      const currentProject = projects.find((p) => p.id === projectId);
      setProject(currentProject || null);

      // Load todos for this project
      const filters: TodoFilters = {
        project_id: projectId,
      };
      const todoList = await todoApi.getAllTodos(filters);
      setTodos(todoList);
    } catch (error) {
      console.error("Failed to load project todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoUpdate = async (todoId: string, updates: TodoUpdate) => {
    try {
      const updatedTodo = await todoApi.updateTodo(todoId, updates);

      // If the todo is moved to a different project, remove it from this view
      if (updates.project_id && updates.project_id !== projectId) {
        setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      } else {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === todoId ? updatedTodo : todo)),
        );
      }
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
    <div className="flex h-full flex-col">
      <TodoHeader title={project?.name || "Project"} todoCount={todos.length} />

      <div className="flex-1 overflow-y-auto">
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onRefresh={loadProjectData}
        />
      </div>
    </div>
  );
}
