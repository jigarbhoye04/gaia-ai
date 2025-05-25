"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { apiauth } from "@/utils/apiaxios";
import { toast } from "sonner";

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded: () => void;
}

const MAX_MEMORY_LENGTH = 500; // Set a reasonable character limit

export default function AddMemoryModal({
  isOpen,
  onClose,
  onMemoryAdded,
}: AddMemoryModalProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus the textarea when the modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (content.trim()) {
        handleSave();
      }
    }
    // Close on Escape
    else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setContent("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="md"
      scrollBehavior="inside"
      classNames={{
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader>Add Memory</ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-2">
                <textarea
                  ref={textareaRef}
                  placeholder="Enter a memory to store..."
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleKeyDown}
                  rows={5}
                  className="w-full resize-none rounded-md bg-zinc-800 p-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  autoFocus
                />
                <div className="text-right text-xs text-gray-400">
                  {content.length}/{MAX_MEMORY_LENGTH} characters
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={handleCancel}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isDisabled={!content.trim()}
                isLoading={isSaving}
              >
                Save Memory
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}