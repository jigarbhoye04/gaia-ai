"use client";

import { Spinner } from "@heroui/spinner";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import TodoDetailSheet from "@/components/Todo/TodoDetailSheet";
import TodoHeader from "@/components/Todo/TodoHeader";
import TodoList from "@/components/Todo/TodoList";
import { TodoService } from "@/services/todoService";
import {
  Priority,
  Project,
  Todo,
  TodoFilters,
  TodoUpdate,
} from "@/types/todoTypes";

export default function TodosPage() {
  const searchParams = useSearchParams();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const ITEMS_PER_PAGE = 50;

  // Get filter from URL params
  const projectId = searchParams.get("project");
  const priority = searchParams.get("priority");
  const completed = searchParams.get("completed") === "true";

  useEffect(() => {
    loadTodos();
    loadProjects();
  }, [projectId, priority, completed]);

  const loadProjects = async () => {
    try {
      const projectList = await TodoService.getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadTodos = async (loadMore = false) => {
    if (!loadMore) {
      setLoading(true);
      setPage(0);
    }

    try {
      const filters: TodoFilters = {
        skip: loadMore ? page * ITEMS_PER_PAGE : 0,
        limit: ITEMS_PER_PAGE,
      };

      // Default to inbox if no project specified
      if (!projectId && !priority && !completed) {
        // This will show inbox todos
        filters.project_id = undefined;
      } else {
        if (projectId) filters.project_id = projectId;
        if (priority) filters.priority = priority as Priority;
        if (completed) filters.completed = true;
      }

      const todoList = await TodoService.getAllTodos(filters);

      if (loadMore) {
        setTodos((prev) => [...prev, ...todoList]);
      } else {
        setTodos(todoList);
      }

      setHasMore(todoList.length === ITEMS_PER_PAGE);
      if (loadMore) setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to load todos:", error);
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
      // Update the selected todo if it's the one being updated
      if (selectedTodo && selectedTodo.id === todoId) {
        setSelectedTodo(updatedTodo);
      }
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleTodoDelete = async (todoId: string) => {
    try {
      await TodoService.deleteTodo(todoId);
      setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-screen max-w-5xl flex-col">
      <TodoHeader title={getPageTitle()} todoCount={todos.length} />

      <div
        className="flex-1 overflow-y-auto"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          if (
            hasMore &&
            !loading &&
            target.scrollHeight - target.scrollTop <= target.clientHeight + 100
          ) {
            loadTodos(true);
          }
        }}
      >
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={(todo) => setSelectedTodo(todo)}
          onRefresh={() => loadTodos(false)}
        />
      </div>

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        todo={selectedTodo}
        isOpen={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onUpdate={handleTodoUpdate}
        onDelete={handleTodoDelete}
        projects={projects}
      />
    </div>
  );

  function getPageTitle() {
    if (projectId) return "Project Tasks";
    if (priority)
      return `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`;
    if (completed) return "Completed Tasks";
    return "Inbox";
  }
}
