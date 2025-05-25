"use client";

import { Spinner } from "@heroui/spinner";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import { TodoService } from "@/services/todoService";
import { Project,Todo, TodoFilters } from "@/types/todoTypes";

export default function ProjectTodosPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      // Load project details
      const projects = await TodoService.getAllProjects();
      const currentProject = projects.find(p => p.id === projectId);
      setProject(currentProject || null);

      // Load todos for this project
      const filters: TodoFilters = {
        project_id: projectId,
      };
      const todoList = await TodoService.getAllTodos(filters);
      setTodos(todoList);
    } catch (error) {
      console.error("Failed to load project todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoUpdate = async (todoId: string, updates: any) => {
    try {
      const updatedTodo = await TodoService.updateTodo(todoId, updates);
      
      // If the todo is moved to a different project, remove it from this view
      if (updates.project_id && updates.project_id !== projectId) {
        setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
      } else {
        setTodos((prev) =>
          prev.map((todo) => (todo.id === todoId ? updatedTodo : todo))
        );
      }
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
        })
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
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TodoHeader
        title={project?.name || "Project"}
        todoCount={todos.length}
        selectedCount={selectedTodos.size}
        onSelectAll={handleSelectAll}
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        allSelected={selectedTodos.size === todos.length && todos.length > 0}
      />
      
      <div className="flex-1 overflow-y-auto">
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
          onRefresh={loadProjectData}
        />
      </div>
    </div>
  );
}