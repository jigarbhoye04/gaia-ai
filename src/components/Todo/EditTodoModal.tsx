"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { CalendarDate, parseDate } from "@internationalized/date";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TodoService } from "@/services/todoService";
import { Priority, Project, Todo, TodoUpdate } from "@/types/todoTypes";

interface EditTodoModalProps {
  todo: Todo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updates: TodoUpdate) => void;
}

const priorityOptions = [
  { value: Priority.NONE, label: "None", color: "default" },
  { value: Priority.LOW, label: "Low", color: "primary" },
  { value: Priority.MEDIUM, label: "Medium", color: "warning" },
  { value: Priority.HIGH, label: "High", color: "danger" },
];

export default function EditTodoModal({
  todo,
  open,
  onOpenChange,
  onSuccess,
}: EditTodoModalProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<TodoUpdate>({
    title: todo.title,
    description: todo.description,
    labels: todo.labels,
    priority: todo.priority,
    project_id: todo.project_id,
    due_date: todo.due_date,
    due_date_timezone: todo.due_date_timezone,
  });
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    if (open) {
      loadProjects();
      // Reset form data when modal opens
      setFormData({
        title: todo.title,
        description: todo.description,
        labels: todo.labels,
        priority: todo.priority,
        project_id: todo.project_id,
        due_date: todo.due_date,
        due_date_timezone: todo.due_date_timezone,
      });
    }
  }, [open, todo]);

  const loadProjects = async () => {
    try {
      const projectList = await TodoService.getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setLoading(true);
    try {
      // Only send changed fields
      const updates: TodoUpdate = {};
      if (formData.title !== todo.title) updates.title = formData.title;
      if (formData.description !== todo.description)
        updates.description = formData.description;
      if (JSON.stringify(formData.labels) !== JSON.stringify(todo.labels))
        updates.labels = formData.labels;
      if (formData.priority !== todo.priority)
        updates.priority = formData.priority;
      if (formData.project_id !== todo.project_id)
        updates.project_id = formData.project_id;
      if (formData.due_date !== todo.due_date) {
        updates.due_date = formData.due_date;
        updates.due_date_timezone = formData.due_date_timezone;
      }

      if (Object.keys(updates).length === 0) {
        onOpenChange(false);
        return;
      }

      await TodoService.updateTodo(todo.id, updates);
      onSuccess?.(updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = () => {
    const trimmedLabel = labelInput.trim();
    if (
      trimmedLabel &&
      formData.labels &&
      !formData.labels.includes(trimmedLabel)
    ) {
      setFormData((prev) => ({
        ...prev,
        labels: [...(prev.labels || []), trimmedLabel],
      }));
      setLabelInput("");
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels?.filter((l) => l !== label) || [],
    }));
  };

  const handleDateChange = (date: CalendarDate | null) => {
    if (date) {
      const jsDate = new Date(date.year, date.month - 1, date.day);
      setFormData((prev) => ({
        ...prev,
        due_date: jsDate.toISOString(),
        due_date_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        due_date: undefined,
        due_date_timezone: undefined,
      }));
    }
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
            <ModalHeader className="flex flex-col gap-1">Edit Task</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {/* Title */}
                <Input
                  label="Task Title"
                  placeholder="Enter task title..."
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  isRequired
                />

                {/* Description */}
                <Textarea
                  label="Description"
                  placeholder="Add a description..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  minRows={2}
                  maxRows={4}
                />

                {/* Project and Priority */}
                <div className="flex gap-3">
                  <Select
                    label="Project"
                    placeholder="Select project"
                    selectedKeys={
                      formData.project_id ? [formData.project_id] : []
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        project_id: e.target.value,
                      }))
                    }
                    className="flex-1"
                  >
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Priority"
                    placeholder="Select priority"
                    selectedKeys={formData.priority ? [formData.priority] : []}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: e.target.value as Priority,
                      }))
                    }
                    className="flex-1"
                  >
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Due Date */}
                <DatePicker
                  label="Due Date"
                  value={
                    formData.due_date
                      ? parseDate(formData.due_date.split("T")[0])
                      : null
                  }
                  onChange={handleDateChange}
                  granularity="day"
                />

                {/* Labels */}
                <div>
                  <div className="mb-2 flex gap-2">
                    <Input
                      placeholder="Add label..."
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLabel();
                        }
                      }}
                      size="sm"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onPress={handleAddLabel}
                      isDisabled={!labelInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.labels && formData.labels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.labels.map((label) => (
                        <Chip
                          key={label}
                          onClose={() => handleRemoveLabel(label)}
                          variant="flat"
                          size="sm"
                        >
                          {label}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
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
                Save Changes
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
