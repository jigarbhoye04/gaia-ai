"use client";

import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { format } from "date-fns";
import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";

import { CalendarIcon } from "@/components/shared/icons";
import { Priority, Todo, TodoUpdate } from "@/types/features/todoTypes";

import TodoModal from "./TodoModal";

interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onUpdate: (todoId: string, updates: TodoUpdate) => void;
  onDelete: (todoId: string) => void;
  onClick?: (todo: Todo) => void;
}

const priorityColors = {
  [Priority.HIGH]: "danger",
  [Priority.MEDIUM]: "warning",
  [Priority.LOW]: "primary",
  [Priority.NONE]: "default",
} as const;

export default function TodoItem({
  todo,
  isSelected,
  onUpdate,
  onDelete,
  onClick,
}: TodoItemProps) {
  const [editOpen, setEditOpen] = useState(false);

  const handleToggleComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onUpdate(todo.id, { completed: !todo.completed });
  };

  const isOverdue =
    todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed;

  return (
    <>
      <div
        className={`pointer-events-auto w-full cursor-pointer rounded-lg border border-default-200 bg-content1 p-3 shadow-sm transition-all ${
          isSelected
            ? "bg-primary/5 ring-2 ring-primary"
            : "hover:bg-default-50"
        } ${todo.completed ? "opacity-60" : ""}`}
        onClick={() => {
          console.log("TodoItem clicked:", todo.title);
          onClick?.(todo);
        }}
      >
        <div className="flex items-center gap-3">
          {/* Complete Checkbox */}
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              isSelected={todo.completed}
              onChange={handleToggleComplete}
              size="sm"
              color="success"
              radius="full"
            />
          </div>

          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {/* Title and Description */}
            <div>
              <h4
                className={`text-sm font-medium ${
                  todo.completed ? "text-foreground-500 line-through" : ""
                }`}
              >
                {todo.title}
              </h4>
              {todo.description && (
                <p className="mt-2 text-xs text-foreground-500">
                  {todo.description}
                </p>
              )}
            </div>

            {(todo.priority !== Priority.NONE ||
              todo.due_date ||
              todo.labels.length > 0) && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Priority */}
                {todo.priority !== Priority.NONE && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color={priorityColors[todo.priority]}
                  >
                    {todo.priority}
                  </Chip>
                )}

                {/* Due Date */}
                {todo.due_date && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue ? "text-danger" : "text-foreground-500"
                    }`}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(todo.due_date), "MMM d")}
                  </div>
                )}

                {/* Labels */}
                {todo.labels.map((label) => (
                  <Chip key={label} size="sm" variant="flat">
                    {label}
                  </Chip>
                ))}

                {/* Subtasks Count */}
                {todo.subtasks.length > 0 && (
                  <Chip size="sm" variant="flat" className="text-xs">
                    {todo.subtasks.filter((s) => s.completed).length}/
                    {todo.subtasks.length} subtasks
                  </Chip>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="h-6 w-6 min-w-6"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Todo actions">
                <DropdownItem
                  key="edit"
                  startContent={<Edit2 className="h-4 w-4" />}
                  onPress={() => setEditOpen(true)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 className="h-4 w-4" />}
                  className="text-danger"
                  color="danger"
                  onPress={() => onDelete(todo.id)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <TodoModal
        mode="edit"
        todo={todo}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false);
        }}
      />
    </>
  );
}
