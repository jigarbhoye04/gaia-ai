"use client";

import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, X } from "lucide-react";
import React, { useState } from "react";

import { Sheet, SheetContent, SheetHeader } from "@/components/ui/shadcn/sheet";
import {
  Priority,
  Project,
  Todo,
  TodoUpdate,
} from "@/types/features/todoTypes";

import SubtaskManager from "./shared/SubtaskManager";
import TodoFieldsRow from "./shared/TodoFieldsRow";

interface TodoDetailSheetProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todoId: string, updates: TodoUpdate) => void;
  onDelete: (todoId: string) => void;
  projects: Project[];
}

export default function TodoDetailSheet({
  todo,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  projects,
}: TodoDetailSheetProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  if (!todo) return null;

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

  const handleTitleEdit = () => {
    setEditedTitle(todo.title);
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== todo.title) {
      onUpdate(todo.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleDescriptionEdit = () => {
    setEditedDescription(todo.description || "");
    setIsEditingDescription(true);
  };

  const handleDescriptionSave = () => {
    if (editedDescription !== todo.description) {
      onUpdate(todo.id, { description: editedDescription });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleFieldChange = (
    field: keyof TodoUpdate,
    value: string | string[] | Priority | undefined,
  ) => {
    onUpdate(todo.id, { [field]: value } as TodoUpdate);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[500px] max-w-[90vw] overflow-hidden bg-zinc-900 p-0"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between px-6 py-4 pt-8">
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onPress={onClose}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
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
            <div className="px-6 py-4">
              <div className="flex items-start gap-4">
                <button
                  onClick={handleToggleComplete}
                  className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    todo.completed
                      ? "bg-green-500"
                      : "border border-zinc-500 hover:border-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {todo.completed && <Check className="h-3 w-3 text-white" />}
                </button>
                <div className="flex-1 space-y-3">
                  {/* Editable Title */}
                  {isEditingTitle ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleTitleSave();
                        if (e.key === "Escape") handleTitleCancel();
                      }}
                      onBlur={handleTitleSave}
                      autoFocus
                      classNames={{
                        input:
                          "text-2xl font-medium bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500",
                        inputWrapper:
                          "border-0 bg-transparent shadow-none hover:bg-transparent focus:bg-transparent data-[focus=true]:bg-transparent",
                      }}
                      variant="underlined"
                    />
                  ) : (
                    <h1
                      onClick={handleTitleEdit}
                      className={`cursor-pointer text-2xl leading-tight font-medium transition-colors hover:text-zinc-200 ${
                        todo.completed
                          ? "text-zinc-500 line-through"
                          : "text-zinc-100"
                      }`}
                    >
                      {todo.title}
                    </h1>
                  )}

                  {/* Editable Description */}
                  {isEditingDescription ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") handleDescriptionCancel();
                      }}
                      onBlur={handleDescriptionSave}
                      placeholder="Add a description..."
                      minRows={2}
                      maxRows={4}
                      autoFocus
                      classNames={{
                        input:
                          "bg-transparent border-0 text-zinc-200 placeholder:text-zinc-500",
                        inputWrapper:
                          "border-0 bg-transparent shadow-none hover:bg-transparent focus:bg-transparent data-[focus=true]:bg-transparent",
                      }}
                      variant="underlined"
                    />
                  ) : (
                    <p
                      onClick={handleDescriptionEdit}
                      className={`cursor-pointer text-sm leading-relaxed transition-colors hover:text-zinc-300 ${
                        todo.completed ? "text-zinc-600" : "text-zinc-400"
                      }`}
                    >
                      {todo.description || "Add a description..."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="px-6 py-4">
              <TodoFieldsRow
                priority={todo.priority}
                projectId={todo.project_id}
                projects={projects}
                dueDate={todo.due_date}
                dueDateTimezone={todo.due_date_timezone}
                labels={todo.labels}
                onPriorityChange={(priority) =>
                  handleFieldChange("priority", priority)
                }
                onProjectChange={(projectId) =>
                  handleFieldChange("project_id", projectId)
                }
                onDateChange={(date, timezone) => {
                  handleFieldChange("due_date", date);
                  if (timezone)
                    handleFieldChange("due_date_timezone", timezone);
                }}
                onLabelsChange={(labels) => handleFieldChange("labels", labels)}
              />
            </div>

            {/* Created Info */}
            <div className="px-6 py-2">
              <span className="text-xs text-zinc-500">
                Created{" "}
                {formatDistanceToNow(new Date(todo.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {/* Subtasks Section */}
            <div className="px-6 py-4 pt-6">
              <SubtaskManager
                subtasks={todo.subtasks}
                onSubtasksChange={handleSubtasksChange}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
