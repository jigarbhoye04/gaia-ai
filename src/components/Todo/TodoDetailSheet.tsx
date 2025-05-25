"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
// Using custom sheet implementation since HeroUI doesn't have Sheet
import { format } from "date-fns";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  Flag,
  FolderOpen,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

import { Priority, Project, Todo, TodoUpdate } from "@/types/todoTypes";

import EditTodoModal from "./EditTodoModal";

interface TodoDetailSheetProps {
  todo: Todo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (todoId: string, updates: TodoUpdate) => void;
  onDelete: (todoId: string) => void;
  projects: Project[];
}

const priorityColors = {
  [Priority.HIGH]: "danger",
  [Priority.MEDIUM]: "warning",
  [Priority.LOW]: "primary",
  [Priority.NONE]: "default",
} as const;

const priorityIcons = {
  [Priority.HIGH]: "🔴",
  [Priority.MEDIUM]: "🟡",
  [Priority.LOW]: "🔵",
  [Priority.NONE]: "⚪",
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
    onUpdate(todo.id, { completed: !todo.completed });
  };

  const handleDelete = () => {
    onDelete(todo.id);
    onClose();
  };

  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-96 transform border-l border-divider bg-background shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-divider p-6">
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">{todo.title}</h3>
              {todo.description && (
                <p className="mt-2 text-sm text-foreground-600">
                  {todo.description}
                </p>
              )}
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={todo.completed ? "solid" : "bordered"}
                color={todo.completed ? "success" : "default"}
                startContent={
                  todo.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )
                }
                onPress={handleToggleComplete}
                className="flex-1"
              >
                {todo.completed ? "Completed" : "Mark Complete"}
              </Button>
              <Button
                size="sm"
                variant="light"
                isIconOnly
                onPress={() => setEditModalOpen(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="light"
                color="danger"
                isIconOnly
                onPress={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Priority */}
              {todo.priority !== Priority.NONE && (
                <div className="flex items-center gap-3">
                  <Flag className="h-4 w-4 text-foreground-500" />
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {priorityIcons[todo.priority]}
                    </span>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={priorityColors[todo.priority]}
                    >
                      {todo.priority} Priority
                    </Chip>
                  </div>
                </div>
              )}

              {/* Project */}
              {project && (
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-foreground-500" />
                  <div className="flex items-center gap-2">
                    {project.color && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <span className="text-sm">{project.name}</span>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {todo.due_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-foreground-500" />
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        isOverdue ? "text-danger" : "text-foreground-700"
                      }`}
                    >
                      Due {format(new Date(todo.due_date), "MMM d, yyyy")}
                    </span>
                    {isOverdue && (
                      <Chip size="sm" color="danger" variant="flat">
                        Overdue
                      </Chip>
                    )}
                  </div>
                </div>
              )}

              {/* Labels */}
              {todo.labels.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="mt-1 h-4 w-4 text-foreground-500" />
                  <div className="flex flex-wrap gap-1">
                    {todo.labels.map((label) => (
                      <Chip key={label} size="sm" variant="flat">
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-foreground-500" />
                <span className="text-sm text-foreground-600">
                  Created {format(new Date(todo.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            {/* Subtasks */}
            {todo.subtasks.length > 0 && (
              <>
                <Divider />
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Subtasks</h4>
                      <span className="text-xs text-foreground-500">
                        {completedSubtasks}/{todo.subtasks.length} completed
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      {todo.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-2 rounded-lg bg-default-50 p-2"
                        >
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                              subtask.completed
                                ? "border-success bg-success"
                                : "border-default-300"
                            }`}
                          >
                            {subtask.completed && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span
                            className={`flex-1 text-sm ${
                              subtask.completed
                                ? "text-foreground-500 line-through"
                                : "text-foreground-700"
                            }`}
                          >
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTodoModal
        todo={todo}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={(updatedTodo) => {
          onUpdate(todo.id, updatedTodo);
          setEditModalOpen(false);
        }}
      />
    </>
  );
}
