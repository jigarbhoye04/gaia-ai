"use client";

import { Button } from "@heroui/react";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { apiauth } from "@/utils/apiaxios";

interface AddMemoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded: () => void;
}

const MAX_MEMORY_LENGTH = 500; // Set a reasonable character limit

export default function AddMemoryForm({
  isOpen,
  onClose,
  onMemoryAdded,
}: AddMemoryFormProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when the form opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure form is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Reset content when form is closed
  useEffect(() => {
    if (!isOpen) {
      setContent("");
    }
  }, [isOpen]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Limit input to maximum character count
    if (e.target.value.length <= MAX_MEMORY_LENGTH) {
      setContent(e.target.value);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      const response = await apiauth.post("memory", {
        content: content.trim(),
      });

      if (response.data.success) {
        toast.success("Memory added successfully");
        setContent("");
        onMemoryAdded();
        onClose();
      } else {
        toast.error(response.data.message || "Failed to add memory");
      }
    } catch (error) {
      console.error("Error adding memory:", error);
      toast.error("Failed to add memory");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (content.trim()) {
        handleSave();
      }
    }
    // Close on Escape
    else if (e.key === "Escape") {
      onClose();
    }
  };

  // If not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="relative mb-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">Add New Memory</h3>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={onClose}
          className="absolute top-2 right-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          placeholder="Enter a memory to store..."
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          rows={4}
          className="w-full resize-none rounded-md bg-zinc-800 p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          autoFocus
        />
        <div className="text-right text-xs text-gray-400">
          {content.length}/{MAX_MEMORY_LENGTH} characters
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="flat" onPress={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          color="primary"
          onPress={handleSave}
          isDisabled={!content.trim()}
          isLoading={isSaving}
        >
          Save Memory
        </Button>
      </div>
    </div>
  );
}
