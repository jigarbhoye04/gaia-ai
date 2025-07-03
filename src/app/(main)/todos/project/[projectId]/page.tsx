"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import { todoApi } from "@/features/todo/api/todoApi";
import TodoDetailSheet from "@/features/todo/components/TodoDetailSheet";
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
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjectData = useCallback(async () => {
    setLoading(true);
    try {
      // Load project details and all projects
      const allProjects = await todoApi.getAllProjects();
      setProjects(allProjects);
      const currentProject = allProjects.find((p) => p.id === projectId);
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
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

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
    <div className="flex h-full w-full flex-col">
      <div className="w-full" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <TodoHeader
          title={project?.name || "Project"}
          todoCount={todos.length}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={(todo) => setSelectedTodo(todo)}
          onRefresh={loadProjectData}
        />
      </div>

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
