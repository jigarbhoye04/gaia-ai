"use client";

import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import TodoDetailSheet from "@/features/todo/components/TodoDetailSheet";
import TodoHeader from "@/features/todo/components/TodoHeader";
import TodoList from "@/features/todo/components/TodoList";
import TodoModal from "@/features/todo/components/TodoModal";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { useUrlTodoSelection } from "@/features/todo/hooks/useUrlTodoSelection";
import { TodoUpdate } from "@/types/features/todoTypes";

export default function CompletedTodosPage() {
  const {
    todos,
    projects,
    loading,
    loadCompletedTodos,
    modifyTodo,
    removeTodo,
  } = useTodos();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { selectedTodoId, selectTodo, clearSelection } = useUrlTodoSelection();

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
    // If the deleted todo was selected (shown in URL), close the detail sheet
    if (selectedTodoId === todoId) {
      clearSelection();
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
          title="Completed"
          todoCount={todos.length}
          onAddTodo={() => setAddModalOpen(true)}
        />
      </div>

      <div className="w-full flex-1 overflow-y-auto px-4">
        <TodoList
          todos={todos}
          onTodoUpdate={handleTodoUpdate}
          onTodoDelete={handleTodoDelete}
          onTodoClick={(todo) => selectTodo(todo.id)}
          onRefresh={() => loadCompletedTodos()}
        />
      </div>

      {/* Add Todo Modal */}
      <TodoModal
        mode="add"
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={() => {
          loadCompletedTodos();
        }}
      />

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        todoId={selectedTodoId}
        isOpen={!!selectedTodoId}
        onClose={clearSelection}
        onUpdate={handleTodoUpdate}
        onDelete={handleTodoDelete}
        projects={projects}
      />
    </div>
  );
}
