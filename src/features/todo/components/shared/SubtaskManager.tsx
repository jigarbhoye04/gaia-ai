"use client";

import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { cn } from "@heroui/theme";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { SubTask } from "@/types/features/todoTypes";

interface SubtaskManagerProps {
  subtasks: SubTask[];
  onSubtasksChange: (subtasks: SubTask[]) => void;
  className?: string;
}

export default function SubtaskManager({
  subtasks,
  onSubtasksChange,
  className,
}: SubtaskManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const completedCount = subtasks.filter((subtask) => subtask.completed).length;
  const totalCount = subtasks.length;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: SubTask = {
      id: Date.now().toString(), // Simple ID generation
      title: newSubtaskTitle.trim(),
      completed: false,
      created_at: new Date().toISOString(),
    };

    onSubtasksChange([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((subtask) =>
      subtask.id === subtaskId
        ? { ...subtask, completed: !subtask.completed }
        : subtask,
    );
    onSubtasksChange(updatedSubtasks);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter(
      (subtask) => subtask.id !== subtaskId,
    );
    onSubtasksChange(updatedSubtasks);
  };

  const handleStartEdit = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = () => {
    if (!editingTitle.trim() || !editingSubtaskId) return;

    const updatedSubtasks = subtasks.map((subtask) =>
      subtask.id === editingSubtaskId
        ? { ...subtask, title: editingTitle.trim() }
        : subtask,
    );
    onSubtasksChange(updatedSubtasks);
    setEditingSubtaskId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditingTitle("");
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    action: "add" | "edit",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (action === "add") {
        handleAddSubtask();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === "Escape" && action === "edit") {
      handleCancelEdit();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Subtasks Header */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 font-medium transition-all hover:bg-default-100",
            isExpanded && "text-primary",
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            size={16}
            className={cn("transition-transform", isExpanded && "rotate-180")}
          />
          <span>Subtasks</span>
          {totalCount > 0 && (
            <span className="text-xs text-default-500">
              ({completedCount}/{totalCount})
            </span>
          )}
        </div>

        {isExpanded && (
          <div
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
            onClick={() => {
              setIsExpanded(true);
              // Focus the input after a brief delay
              setTimeout(() => {
                const input = document.querySelector(
                  "[data-subtask-input]",
                ) as HTMLInputElement;
                input?.focus();
              }, 100);
            }}
          >
            <Plus size={16} />
          </div>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-3">
          {/* Add New Subtask */}
          <div className="flex gap-2">
            <Input
              data-subtask-input
              placeholder="Add a subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "add")}
              size="sm"
              className="flex-1"
              classNames={{
                input: "text-sm",
                inputWrapper: "h-8",
              }}
            />
            <div
              className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors ${
                !newSubtaskTitle.trim()
                  ? "bg-default-100 text-default-400"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
              onClick={handleAddSubtask}
            >
              <Plus size={14} />
            </div>
          </div>

          {/* Existing Subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border border-transparent p-2 transition-colors",
                    "hover:border-default-200 hover:bg-default-50",
                  )}
                >
                  <Checkbox
                    isSelected={subtask.completed}
                    onValueChange={() => handleToggleSubtask(subtask.id)}
                    size="sm"
                    className="flex-shrink-0"
                  />

                  {editingSubtaskId === subtask.id ? (
                    <div className="flex flex-1 gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, "edit")}
                        size="sm"
                        className="flex-1"
                        autoFocus
                        classNames={{
                          input: "text-sm",
                          inputWrapper: "h-7",
                        }}
                      />
                      <div
                        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xs transition-colors ${
                          !editingTitle.trim()
                            ? "bg-default-100 text-default-400"
                            : "bg-success text-white hover:bg-success/90"
                        }`}
                        onClick={handleSaveEdit}
                      >
                        ✓
                      </div>
                      <div
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-default-100 text-default-600 transition-colors hover:bg-default-200"
                        onClick={handleCancelEdit}
                      >
                        <X size={12} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "flex-1 cursor-pointer text-sm select-none",
                          subtask.completed && "text-default-400 line-through",
                        )}
                        onClick={() => handleStartEdit(subtask)}
                      >
                        {subtask.title}
                      </span>
                      <div
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-danger opacity-0 transition-all group-hover:opacity-100 hover:bg-danger/10"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash2 size={12} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Summary */}
          {totalCount > 0 && (
            <div className="rounded-lg bg-default-100 p-2">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-default-600">Progress</span>
                <span className="font-medium">
                  {completedCount}/{totalCount} completed
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-default-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
