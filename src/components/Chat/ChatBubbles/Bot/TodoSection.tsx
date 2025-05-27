"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Flag,
  FolderOpen,
  Hash,
  ListTodo,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  TodoAction,
  TodoItem,
  TodoProject,
  TodoStats,
} from "@/types/todoToolTypes";
import { Priority } from "@/types/todoTypes";

interface TodoSectionProps {
  todos?: TodoItem[];
  projects?: TodoProject[];
  stats?: TodoStats;
  action?: TodoAction;
  message?: string;
}

const priorityConfig = {
  [Priority.HIGH]: {
    color: "danger" as const,
    icon: <Flag className="h-3 w-3" />,
    bgColor: "bg-red-500/10",
    textColor: "text-red-500",
  },
  [Priority.MEDIUM]: {
    color: "warning" as const,
    icon: <Flag className="h-3 w-3" />,
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-500",
  },
  [Priority.LOW]: {
    color: "primary" as const,
    icon: <Flag className="h-3 w-3" />,
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
  },
  [Priority.NONE]: {
    color: "default" as const,
    icon: null,
    bgColor: "",
    textColor: "text-gray-500",
  },
};

export default function TodoSection({
  todos,
  projects,
  stats,
  action = "list",
  message,
}: TodoSectionProps) {
  const router = useRouter();
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());

  const toggleTodoExpansion = (todoId: string) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedTodos(newExpanded);
  };

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
    return format(dueDate, "MMM d");
  };

  const isOverdue = (date: string) => {
    return (
      new Date(date) < new Date() &&
      !todos?.find((t) => t.due_date === date)?.completed
    );
  };

  // Statistics View
  if (action === "stats" && stats) {
    return (
      <Card className="mt-4 border border-divider bg-background/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Todo Statistics</h3>
          </div>
        </CardHeader>
        <CardBody className="pt-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-foreground-500">Total Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {stats.completed}
              </p>
              <p className="text-xs text-foreground-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              <p className="text-xs text-foreground-500">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-danger">{stats.overdue}</p>
              <p className="text-xs text-foreground-500">Overdue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.today}</p>
              <p className="text-xs text-foreground-500">Due Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {stats.upcoming}
              </p>
              <p className="text-xs text-foreground-500">Upcoming</p>
            </div>
          </div>
          {message && (
            <p className="mt-4 text-sm text-foreground-600">{message}</p>
          )}
        </CardBody>
      </Card>
    );
  }

  // Projects View
  if (projects && projects.length > 0 && !todos) {
    return (
      <Card className="mt-4 border border-divider bg-background/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Projects</h3>
          </div>
        </CardHeader>
        <CardBody className="pt-1">
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-default-100"
                onClick={() => router.push(`/todos/project/${project.id}`)}
              >
                <div className="flex items-center gap-3">
                  {project.color && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                  )}
                  <span className="text-sm font-medium">{project.name}</span>
                </div>
                {project.todo_count !== undefined && (
                  <Chip size="sm" variant="flat">
                    {project.todo_count} tasks
                  </Chip>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  // Todos List View
  if (todos && todos.length > 0) {
    return (
      <Card className="mt-4 border border-divider bg-background/60 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold">
                {action === "search" ? "Search Results" : "Tasks"}
              </h3>
            </div>
            <Chip size="sm" variant="flat">
              {todos.length} {todos.length === 1 ? "task" : "tasks"}
            </Chip>
          </div>
        </CardHeader>
        <CardBody className="pt-1">
          <div className="space-y-3">
            {todos.map((todo) => {
              const isExpanded = expandedTodos.has(todo.id);
              const hasDetails =
                todo.description || (todo.subtasks && todo.subtasks.length > 0);

              return (
                <div
                  key={todo.id}
                  className="rounded-lg border border-divider bg-default-50 p-4"
                >
                  {/* Todo Header */}
                  <div className="flex items-start gap-3">
                    <button
                      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        todo.completed
                          ? "border-success bg-success"
                          : "border-default-400 hover:border-default-500"
                      }`}
                    >
                      {todo.completed && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            todo.completed
                              ? "text-foreground-500 line-through"
                              : ""
                          }`}
                        >
                          {todo.title}
                        </h4>
                        {hasDetails && (
                          <button
                            onClick={() => toggleTodoExpansion(todo.id)}
                            className="rounded p-1 hover:bg-default-100"
                          >
                            <ChevronRight
                              className={`h-4 w-4 text-default-500 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Todo Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {todo.priority !== Priority.NONE && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className={priorityConfig[todo.priority].bgColor}
                            startContent={priorityConfig[todo.priority].icon}
                          >
                            <span
                              className={
                                priorityConfig[todo.priority].textColor
                              }
                            >
                              {todo.priority}
                            </span>
                          </Chip>
                        )}

                        {todo.due_date && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              isOverdue(todo.due_date) ? "danger" : "default"
                            }
                            startContent={<Calendar className="h-3 w-3" />}
                          >
                            {formatDueDate(todo.due_date)}
                          </Chip>
                        )}

                        {todo.project && (
                          <Chip
                            size="sm"
                            variant="flat"
                            startContent={
                              todo.project.color ? (
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: todo.project.color,
                                  }}
                                />
                              ) : (
                                <FolderOpen className="h-3 w-3" />
                              )
                            }
                          >
                            {todo.project.name}
                          </Chip>
                        )}

                        {todo.labels.map((label) => (
                          <Chip
                            key={label}
                            size="sm"
                            variant="flat"
                            startContent={<Hash className="h-3 w-3" />}
                          >
                            {label}
                          </Chip>
                        ))}

                        {todo.subtasks && todo.subtasks.length > 0 && (
                          <Chip size="sm" variant="flat">
                            {todo.subtasks.filter((s) => s.completed).length}/
                            {todo.subtasks.length} subtasks
                          </Chip>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {todo.description && (
                            <p className="text-sm text-foreground-600">
                              {todo.description}
                            </p>
                          )}

                          {todo.subtasks && todo.subtasks.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-foreground-500">
                                Subtasks
                              </p>
                              {todo.subtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className="flex items-center gap-2 pl-2"
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                      subtask.completed
                                        ? "border-success bg-success"
                                        : "border-default-300"
                                    }`}
                                  >
                                    {subtask.completed && (
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs ${
                                      subtask.completed
                                        ? "text-foreground-500 line-through"
                                        : ""
                                    }`}
                                  >
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {message && (
            <>
              <Divider className="my-3" />
              <p className="text-sm text-foreground-600">{message}</p>
            </>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Plus className="h-4 w-4" />}
              onPress={() => router.push("/todos")}
            >
              Add Task
            </Button>
            <Button
              size="sm"
              variant="light"
              onPress={() => router.push("/todos")}
            >
              View All Tasks
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Empty State
  if (action === "list" && (!todos || todos.length === 0)) {
    return (
      <Card className="mt-4 border border-divider bg-background/60 backdrop-blur">
        <CardBody className="py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-default-300" />
          <p className="mt-2 text-sm font-medium">No tasks found</p>
          {message && (
            <p className="mt-1 text-xs text-foreground-500">{message}</p>
          )}
          <Button
            size="sm"
            color="primary"
            variant="flat"
            className="mt-4"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => router.push("/todos")}
          >
            Create Your First Task
          </Button>
        </CardBody>
      </Card>
    );
  }

  // Success Message
  if (message && !todos && !stats && !projects) {
    return (
      <Card className="mt-4 border border-divider bg-background/60 backdrop-blur">
        <CardBody className="flex flex-row items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm">{message}</p>
        </CardBody>
      </Card>
    );
  }

  return null;
}
