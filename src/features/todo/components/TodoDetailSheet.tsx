"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { format, formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  Edit2,
  Flag,
  FolderOpen,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";

import { Sheet, SheetContent, SheetHeader } from "@/components/ui/shadcn/sheet";
import {
  Priority,
  Project,
  Todo,
  TodoUpdate,
} from "@/types/features/todoTypes";

import SubtaskManager from "./shared/SubtaskManager";
import TodoModal from "./TodoModal";

interface TodoDetailSheetProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todoId: string, updates: TodoUpdate) => void;
  onDelete: (todoId: string) => void;
  projects: Project[];
}

const priorityConfig = {
  [Priority.HIGH]: {
    color: "danger" as const,
    label: "High Priority",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-200",
  },
  [Priority.MEDIUM]: {
    color: "warning" as const,
    label: "Medium Priority",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-200",
  },
  [Priority.LOW]: {
    color: "primary" as const,
    label: "Low Priority",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
  },
  [Priority.NONE]: {
    color: "default" as const,
    label: "No Priority",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
  },
};

export default function TodoDetailSheet({
  todo,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  projects,
}: TodoDetailSheetProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!todo) return null;

  const project = projects.find((p) => p.id === todo.project_id);
  const isOverdue =
    todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed;

  const handleToggleComplete = () => {
    try {
      onUpdate(todo.id, { completed: !todo.completed });
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleDelete = () => {
    onDelete(todo.id);
    onClose();
  };

  const handleSubtasksChange = (subtasks: typeof todo.subtasks) => {
    onUpdate(todo.id, { subtasks });
  };

  // Format due date
  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Tomorrow";
    if (daysDiff === -1) return "Yesterday";
    if (daysDiff > 0 && daysDiff < 7) return format(dueDate, "EEEE");
    return format(dueDate, "MMM d, yyyy");
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-[500px] max-w-[90vw] overflow-hidden border-l border-zinc-800 bg-zinc-900 p-0"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <SheetHeader className="flex flex-row items-center justify-between border-b border-zinc-800 px-6 py-4 pt-10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Task Details
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => setEditModalOpen(true)}
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  color="danger"
                  onPress={handleDelete}
                  className="h-8 w-8 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Title and Description Section */}
              <div className="border-b border-zinc-800 px-6 py-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={handleToggleComplete}
                    className={`mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      todo.completed
                        ? "border-green-500 bg-green-500 shadow-md shadow-green-500/25"
                        : "border-zinc-600 hover:border-zinc-500 hover:bg-zinc-800"
                    }`}
                  >
                    {todo.completed && (
                      <Check className="h-3.5 w-3.5 text-white" />
                    )}
                  </button>
                  <div className="flex-1 space-y-3">
                    <h1
                      className={`text-xl leading-tight font-semibold ${
                        todo.completed
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                      }`}
                    >
                      {todo.title}
                    </h1>
                    {todo.description && (
                      <p
                        className={`text-sm leading-relaxed ${
                          todo.completed ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata Section */}
              <div className="space-y-1 px-6 py-6">
                {/* Priority */}
                {todo.priority !== Priority.NONE && (
                  <div className="flex items-center justify-between rounded-lg py-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3 text-sm">
                      <Flag className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Priority</span>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      className={`${priorityConfig[todo.priority].bgColor} ${priorityConfig[todo.priority].textColor} font-medium`}
                    >
                      {priorityConfig[todo.priority].label}
                    </Chip>
                  </div>
                )}

                {/* Project */}
                {project && (
                  <div className="flex items-center justify-between rounded-lg py-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3 text-sm">
                      <FolderOpen className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Project</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <div
                          className="h-3 w-3 rounded-full shadow-sm"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-zinc-200">
                        {project.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {todo.due_date && (
                  <div className="flex items-center justify-between rounded-lg py-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Due Date</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isOverdue ? "text-red-400" : "text-zinc-200"
                      }`}
                    >
                      {formatDueDate(todo.due_date)}
                    </span>
                  </div>
                )}

                {/* Labels */}
                {todo.labels.length > 0 && (
                  <div className="flex items-start justify-between rounded-lg py-3 transition-colors hover:bg-zinc-800/50">
                    <div className="flex items-center gap-3 text-sm">
                      <Tag className="mt-1 h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">Labels</span>
                    </div>
                    <div className="flex max-w-[200px] flex-wrap justify-end gap-1.5">
                      {todo.labels.map((label) => (
                        <Chip
                          key={label}
                          size="sm"
                          variant="flat"
                          className="border border-zinc-700 bg-zinc-800 text-zinc-300"
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Created */}
                <div className="flex items-center justify-between rounded-lg py-3 transition-colors hover:bg-zinc-800/50">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-400">Created</span>
                  </div>
                  <span className="text-sm text-zinc-400">
                    {formatDistanceToNow(new Date(todo.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {/* Subtasks Section */}
              <div className="border-t border-zinc-800">
                <div className="px-6 py-5">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-medium text-zinc-300">
                      Subtasks
                    </h3>
                    {todo.subtasks.length > 0 && (
                      <span className="text-xs text-zinc-500">
                        {todo.subtasks.filter((s) => s.completed).length} of{" "}
                        {todo.subtasks.length} completed
                      </span>
                    )}
                  </div>
                  <SubtaskManager
                    subtasks={todo.subtasks}
                    onSubtasksChange={handleSubtasksChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Modal */}
      <TodoModal
        mode="edit"
        todo={todo}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditModalOpen(false);
        }}
      />
    </>
  );
}
