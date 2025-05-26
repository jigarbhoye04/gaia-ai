"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
// Using custom sheet implementation since HeroUI doesn't have Sheet
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Flag,
  FolderOpen,
  History,
  Info,
  RotateCcw,
  Tag,
  Timer,
  Trash2,
  User,
} from "lucide-react";
import React, { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  const handleToggleComplete = async () => {
    try {
      await onUpdate(todo.id, { completed: !todo.completed });
      // The sheet will automatically update when the parent updates the todo
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleDelete = () => {
    onDelete(todo.id);
    onClose();
  };

  const completedSubtasks = todo.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = todo.subtasks.length;
  const progressPercentage =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-96 overflow-hidden border-none bg-zinc-900 p-0"
        >
          <div className="relative flex h-full flex-col">
            <SheetHeader className="border-b border-divider p-6">
              <SheetTitle className="text-lg font-semibold">
                {todo.title}
              </SheetTitle>
              {todo.description && (
                <p className="mt-2 text-sm text-foreground-600">
                  {todo.description}
                </p>
              )}
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-6 pb-24">
              {/* Status Section */}
              <Card className="border-default-200 bg-default-50">
                <CardBody className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {todo.completed ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                          <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                          <Circle className="h-6 w-6 text-warning" />
                        </div>
                      )}
                      <div>
                        <span
                          className={`text-sm font-semibold ${
                            todo.completed ? "text-success" : "text-warning"
                          }`}
                        >
                          {todo.completed ? "Completed" : "In Progress"}
                        </span>
                        {todo.completed && todo.updated_at && (
                          <p className="text-xs text-foreground-500">
                            Completed{" "}
                            {format(
                              new Date(todo.updated_at),
                              "MMM d 'at' h:mm a",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    {isOverdue && !todo.completed && (
                      <Chip
                        size="sm"
                        color="danger"
                        variant="flat"
                        startContent={<AlertCircle className="h-3 w-3" />}
                      >
                        Overdue
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-col gap-2">
                {!todo.completed ? (
                  <Button
                    size="md"
                    color="success"
                    variant="solid"
                    startContent={<CheckCircle2 className="h-5 w-5" />}
                    onPress={handleToggleComplete}
                    className="w-full font-medium"
                  >
                    Mark as Complete
                  </Button>
                ) : (
                  <Button
                    size="md"
                    color="warning"
                    variant="flat"
                    startContent={<RotateCcw className="h-5 w-5" />}
                    onPress={handleToggleComplete}
                    className="w-full font-medium"
                  >
                    Mark as Incomplete
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button
                    size="md"
                    variant="flat"
                    startContent={<Edit2 className="h-4 w-4" />}
                    onPress={() => setEditModalOpen(true)}
                    className="flex-1"
                  >
                    Edit Task
                  </Button>
                  <Button
                    size="md"
                    variant="flat"
                    color="danger"
                    startContent={<Trash2 className="h-4 w-4" />}
                    onPress={handleDelete}
                    className="flex-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Task Information Card */}
              <Card>
                <CardHeader className="pb-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold">
                    <Info className="h-4 w-4" />
                    Task Details
                  </h4>
                </CardHeader>
                <CardBody className="pt-2">
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
                    {todo.labels.length > 0 ? (
                      <div className="flex items-start gap-3">
                        <Tag className="mt-1 h-4 w-4 text-foreground-500" />
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-foreground-700">
                            Labels
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {todo.labels.map((label) => (
                              <Chip key={label} size="sm" variant="flat">
                                #{label}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 opacity-50">
                        <Tag className="h-4 w-4 text-foreground-500" />
                        <span className="text-sm text-foreground-500 italic">
                          No labels assigned
                        </span>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-foreground-500" />
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground-700">
                          Created{" "}
                          {format(
                            new Date(todo.created_at),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </span>
                        <span className="text-xs text-foreground-500">
                          {format(new Date(todo.created_at), "EEEE")}
                        </span>
                      </div>
                    </div>

                    {/* Updated Date */}
                    {todo.updated_at !== todo.created_at && (
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-foreground-500" />
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground-700">
                            Last updated{" "}
                            {format(
                              new Date(todo.updated_at),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </span>
                          <span className="text-xs text-foreground-500">
                            {format(new Date(todo.updated_at), "EEEE")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Timezone Info */}
                    {todo.due_date_timezone && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-foreground-500" />
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground-700">
                            Timezone
                          </span>
                          <span className="text-xs text-foreground-500">
                            {todo.due_date_timezone}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Progress Section */}
              {todo.subtasks.length > 0 && (
                <Card className="bg-gradient-to-br from-default-50 to-default-100">
                  <CardBody className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                          <Timer className="h-4 w-4" />
                          Overall Progress
                        </h4>
                        <span className="text-lg font-bold text-foreground">
                          {progressPercentage}%
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-default-200">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-success to-success-600 transition-all duration-500 ease-out"
                          style={{
                            width: `${progressPercentage}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-500">
                          {completedSubtasks} of {todo.subtasks.length} subtasks
                          completed
                        </span>
                        {completedSubtasks === todo.subtasks.length && (
                          <Chip size="sm" color="success" variant="flat">
                            All Done!
                          </Chip>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Subtasks */}
              {todo.subtasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" />
                        Subtasks
                      </h4>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          completedSubtasks === todo.subtasks.length
                            ? "success"
                            : "default"
                        }
                      >
                        {completedSubtasks}/{todo.subtasks.length}
                      </Chip>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-2">
                      {todo.subtasks.map((subtask, index) => (
                        <div
                          key={subtask.id}
                          className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                            subtask.completed
                              ? "border border-success/20 bg-success/10"
                              : "border border-default-200 bg-default-50 hover:bg-default-100"
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            {subtask.completed ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-default-300">
                                <span className="text-xs text-foreground-500">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <span
                            className={`flex-1 text-sm transition-all ${
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
              )}
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="absolute right-0 bottom-0 left-0 border-t border-divider bg-background/95 p-4 backdrop-blur-md">
              <div className="flex gap-2">
                {!todo.completed ? (
                  <Button
                    size="lg"
                    color="success"
                    variant="solid"
                    startContent={<CheckCircle2 className="h-5 w-5" />}
                    onPress={handleToggleComplete}
                    className="flex-1 font-semibold"
                  >
                    Complete Task
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    color="default"
                    variant="flat"
                    startContent={<RotateCcw className="h-5 w-5" />}
                    onPress={handleToggleComplete}
                    className="flex-1 font-semibold"
                  >
                    Reopen Task
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
