"use client";

import { Todo, TodoUpdate } from "@/types/todoTypes";

import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  selectedTodos: Set<string>;
  onTodoUpdate: (todoId: string, updates: TodoUpdate) => void;
  onTodoDelete: (todoId: string) => void;
  onTodoSelect: (todoId: string) => void;
  onRefresh?: () => void;
}

export default function TodoList({
  todos,
  selectedTodos,
  onTodoUpdate,
  onTodoDelete,
  onTodoSelect,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-foreground-500">
        <p className="mb-2 text-lg">No tasks found</p>
        <p className="text-sm">Create a new task to get started</p>
      </div>
    );
  }

  // Group todos by date if they have due dates
  const groupedTodos = groupTodosByDate(todos);

  return (
    <div className="space-y-4 p-4">
      {Object.entries(groupedTodos).map(([date, todosForDate]) => (
        <div key={date}>
          {date !== "No Due Date" && (
            <h3 className="mb-2 text-sm font-medium text-foreground-600">
              {date}
            </h3>
          )}
          <div className="space-y-2">
            {todosForDate.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isSelected={selectedTodos.has(todo.id)}
                onUpdate={onTodoUpdate}
                onDelete={onTodoDelete}
                onSelect={onTodoSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupTodosByDate(todos: Todo[]) {
  const groups: Record<string, Todo[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  todos.forEach((todo) => {
    let dateKey = "No Due Date";

    if (todo.due_date) {
      const dueDate = new Date(todo.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        dateKey = "Overdue";
      } else if (dueDate.getTime() === today.getTime()) {
        dateKey = "Today";
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        dateKey = "Tomorrow";
      } else {
        dateKey = dueDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
      }
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(todo);
  });

  // Sort groups by date priority
  const sortedGroups: Record<string, Todo[]> = {};
  const order = ["Overdue", "Today", "Tomorrow"];

  order.forEach((key) => {
    if (groups[key]) {
      sortedGroups[key] = groups[key];
    }
  });

  // Add remaining dates sorted chronologically
  Object.keys(groups)
    .filter((key) => !order.includes(key) && key !== "No Due Date")
    .sort((a, b) => {
      const dateA = new Date(groups[a][0].due_date!);
      const dateB = new Date(groups[b][0].due_date!);
      return dateA.getTime() - dateB.getTime();
    })
    .forEach((key) => {
      sortedGroups[key] = groups[key];
    });

  // Add "No Due Date" at the end
  if (groups["No Due Date"]) {
    sortedGroups["No Due Date"] = groups["No Due Date"];
  }

  return sortedGroups;
}
