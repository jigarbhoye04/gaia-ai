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
import { parseDate } from "@internationalized/date";
import { useEffect,useState } from "react";
import { toast } from "sonner";

import { TodoService } from "@/services/todoService";
import { Priority, Project, TodoCreate } from "@/types/todoTypes";

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
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<TodoCreate>({
    title: "",
    description: "",
    labels: [],
    priority: Priority.NONE,
    project_id: initialProjectId,
  });
  const [labelInput, setLabelInput] = useState("");

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  useEffect(() => {
    if (initialProjectId) {
      setFormData((prev) => ({ ...prev, project_id: initialProjectId }));
    }
  }, [initialProjectId]);

  const loadProjects = async () => {
    try {
      const projectList = await TodoService.getAllProjects();
      setProjects(projectList);
      
      // Set default project if not set
      if (!formData.project_id) {
        const inboxProject = projectList.find((p) => p.is_default);
        if (inboxProject) {
          setFormData((prev) => ({ ...prev, project_id: inboxProject.id }));
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    setLoading(true);
    try {
      await TodoService.createTodo(formData);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        labels: [],
        priority: Priority.NONE,
        project_id: formData.project_id,
      });
      setLabelInput("");
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = () => {
    const trimmedLabel = labelInput.trim();
    if (trimmedLabel && !formData.labels.includes(trimmedLabel)) {
      setFormData((prev) => ({
        ...prev,
        labels: [...prev.labels, trimmedLabel],
      }));
      setLabelInput("");
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.filter((l) => l !== label),
    }));
  };

  const handleDateChange = (date: any) => {
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
            <ModalHeader className="flex flex-col gap-1">
              Add New Task
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {/* Title */}
                <Input
                  label="Task Title"
                  placeholder="Enter task title..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  isRequired
                  autoFocus
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
                    selectedKeys={formData.project_id ? [formData.project_id] : []}
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
                    selectedKeys={[formData.priority]}
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
                  <div className="flex gap-2 mb-2">
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
                  {formData.labels.length > 0 && (
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
                Add Task
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}