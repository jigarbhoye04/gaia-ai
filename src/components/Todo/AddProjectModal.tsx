"use client";

import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Radio,RadioGroup } from "@heroui/radio";
import { useState } from "react";
import { toast } from "sonner";

import { TodoService } from "@/services/todoService";
import { ProjectCreate } from "@/types/todoTypes";

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const colorOptions = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

export default function AddProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: AddProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProjectCreate>({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setLoading(true);
    try {
      await TodoService.createProject(formData);
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={onOpenChange}
      size="md"
      placement="center"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Create New Project
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                {/* Name */}
                <Input
                  label="Project Name"
                  placeholder="Enter project name..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
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
                  maxRows={3}
                />

                {/* Color */}
                <div>
                  <label className="text-sm font-medium text-foreground-600 mb-2 block">
                    Project Color
                  </label>
                  <RadioGroup
                    value={formData.color}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, color: value }))
                    }
                    orientation="horizontal"
                    className="gap-3"
                  >
                    {colorOptions.map((option) => (
                      <Radio
                        key={option.value}
                        value={option.value}
                        className="p-0"
                      >
                        <div
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: option.value }}
                        />
                      </Radio>
                    ))}
                  </RadioGroup>
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
                Create Project
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}