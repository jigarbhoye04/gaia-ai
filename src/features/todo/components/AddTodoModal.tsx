"use client";

import { Input, Textarea } from "@heroui/input";
import { useEffect } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/shadcn/dialog";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { useModalForm } from "@/hooks/ui/useModalForm";
import { Priority, TodoCreate } from "@/types/features/todoTypes";

import SubtaskManager from "./shared/SubtaskManager";
import TodoFieldsRow from "./shared/TodoFieldsRow";

interface AddTodoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialProjectId?: string;
}

const priorityOptions = [
  { value: Priority.NONE, label: "None", color: "default" },
  { value: Priority.LOW, label: "Low", color: "primary" },
  { value: Priority.MEDIUM, label: "Medium", color: "warning" },
  { value: Priority.HIGH, label: "High", color: "danger" },
];

export default function AddTodoModal({
  open,
  onOpenChange,
  onSuccess,
  initialProjectId,
}: AddTodoModalProps) {
  const { projects, addTodo } = useTodos();

  const { formData, setFormData, loading, handleSubmit, updateField } =
    useModalForm<TodoCreate>({
      initialData: () => ({
        title: "",
        description: "",
        labels: [],
        priority: Priority.NONE,
        project_id: initialProjectId,
        subtasks: [],
      }),
      onSubmit: async (data: TodoCreate) => {
        await addTodo(data);
      },
      validate: [
        {
          field: "title",
          required: true,
          message: "Please enter a task title",
        },
      ],
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
      successMessage: "Task created successfully",
      resetOnSuccess: true,
    });

  // Set initial project ID when it changes
  useEffect(() => {
    if (initialProjectId) {
      updateField("project_id", initialProjectId);
    }
  }, [initialProjectId, updateField]);

  // Set default project when projects are loaded
  useEffect(() => {
    if (!formData.project_id && projects.length > 0) {
      const inboxProject = projects.find((p) => p.is_default);
      if (inboxProject) {
        updateField("project_id", inboxProject.id);
      }
    }
  }, [projects, formData.project_id, updateField]);

  const handleDateChange = (date?: string, timezone?: string) => {
    setFormData((prev) => ({
      ...prev,
      due_date: date,
      due_date_timezone: timezone,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl border-none bg-zinc-900">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            {/* Title */}
            <Input
              placeholder="Task title"
              classNames={{
                input:
                  "text-2xl font-semibold bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500",
                inputWrapper:
                  "border-0 bg-transparent shadow-none hover:bg-transparent focus:bg-transparent data-[focus=true]:bg-transparent",
              }}
              value={formData.title}
              variant="underlined"
              onChange={(e) => updateField("title", e.target.value)}
              required
              autoFocus
            />

            {/* Description */}
            <Textarea
              placeholder="Add a description..."
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              minRows={1}
              maxRows={5}
              variant="underlined"
              classNames={{
                input:
                  "bg-transparent border-0 text-zinc-200 placeholder:text-zinc-500",
                inputWrapper:
                  "border-0 bg-transparent shadow-none hover:bg-transparent focus:bg-transparent data-[focus=true]:bg-transparent",
              }}
            />
          </div>

          {/* Fields Row with Chips */}
          <TodoFieldsRow
            priority={formData.priority}
            projectId={formData.project_id}
            projects={projects}
            dueDate={formData.due_date}
            dueDateTimezone={formData.due_date_timezone}
            labels={formData.labels}
            onPriorityChange={(priority) => updateField("priority", priority)}
            onProjectChange={(projectId) =>
              updateField("project_id", projectId)
            }
            onDateChange={handleDateChange}
            onLabelsChange={(labels) => updateField("labels", labels)}
          />

          {/* Subtasks Manager */}
          <SubtaskManager
            subtasks={formData.subtasks || []}
            onSubtasksChange={(subtasks) => updateField("subtasks", subtasks)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-0 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="border-0 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Adding..." : "Add Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
