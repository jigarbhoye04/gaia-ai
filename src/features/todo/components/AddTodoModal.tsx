"use client";

import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalFooter } from "@heroui/modal";
import { useEffect } from "react";

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
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="lg"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalBody className="pt-7">
              <div className="flex flex-col gap-6">
                {/* Title */}
                <Input
                  placeholder="Task title"
                  classNames={{ input: "text-2xl font-medium" }}
                  value={formData.title}
                  variant="underlined"
                  onChange={(e) => updateField("title", e.target.value)}
                  isRequired
                  autoFocus
                />

                {/* Description */}
                <Textarea
                  placeholder="Add a description..."
                  value={formData.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  minRows={2}
                  maxRows={4}
                  variant="underlined"
                />

                {/* Fields Row with Chips */}
                <TodoFieldsRow
                  priority={formData.priority}
                  projectId={formData.project_id}
                  projects={projects}
                  dueDate={formData.due_date}
                  dueDateTimezone={formData.due_date_timezone}
                  labels={formData.labels}
                  onPriorityChange={(priority) =>
                    updateField("priority", priority)
                  }
                  onProjectChange={(projectId) =>
                    updateField("project_id", projectId)
                  }
                  onDateChange={handleDateChange}
                  onLabelsChange={(labels) => updateField("labels", labels)}
                />

                {/* Subtasks Manager */}
                <SubtaskManager
                  subtasks={formData.subtasks || []}
                  onSubtasksChange={(subtasks) =>
                    updateField("subtasks", subtasks)
                  }
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={loading}
              >
                Add Task
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
