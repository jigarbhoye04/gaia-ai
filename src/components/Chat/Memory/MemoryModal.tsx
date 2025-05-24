"use client";

import {
  Button,
  Card,
  CardBody,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Spinner,
  Textarea,
} from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import apiaxios from "@/utils/apiaxios";

interface Memory {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [newMemoryContent, setNewMemoryContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMemories = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await apiaxios.get("memory", {
        params: { page, page_size: 10 },
      });

      setMemories(response.data.memories || []);
      setTotalPages(Math.ceil((response.data.total_count || 0) / 10));
    } catch (error) {
      console.error("Error fetching memories:", error);
      toast.error("Failed to load memories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories(currentPage);
    }
  }, [isOpen, currentPage]);

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return;

    try {
      const response = await apiaxios.post("memory", {
        content: newMemoryContent.trim(),
      });

      if (response.data.success) {
        toast.success("Memory added successfully");
        setNewMemoryContent("");
        setIsAddingMemory(false);
        fetchMemories(currentPage);
      } else {
        toast.error(response.data.message || "Failed to add memory");
      }
    } catch (error) {
      console.error("Error adding memory:", error);
      toast.error("Failed to add memory");
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    setDeletingId(memoryId);
    try {
      const response = await apiaxios.delete(`memory/${memoryId}`);

      if (response.data.success) {
        toast.success("Memory deleted");
        fetchMemories(currentPage);
      } else {
        toast.error(response.data.message || "Failed to delete memory");
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
      toast.error("Failed to delete memory");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all memories? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await apiaxios.delete("memory");

      if (response.data.success) {
        toast.success(response.data.message);
        setMemories([]);
        setCurrentPage(1);
        setTotalPages(1);
      } else {
        toast.error(response.data.message || "Failed to clear memories");
      }
    } catch (error) {
      console.error("Error clearing memories:", error);
      toast.error("Failed to clear memories");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        body: "py-6",
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <span>Your Memories</span>
            </ModalHeader>

            <ModalBody>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  GAIA remembers important information from our conversations
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="h-4 w-4" />}
                    onPress={() => setIsAddingMemory(true)}
                  >
                    Add Memory
                  </Button>
                  {memories.length > 0 && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={handleClearAll}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isAddingMemory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <Card>
                      <CardBody className="gap-3">
                        <Textarea
                          placeholder="Enter a memory to store..."
                          value={newMemoryContent}
                          onChange={(e) => setNewMemoryContent(e.target.value)}
                          minRows={2}
                          maxRows={4}
                          classNames={{
                            input: "resize-none",
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => {
                              setIsAddingMemory(false);
                              setNewMemoryContent("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            onPress={handleAddMemory}
                            isDisabled={!newMemoryContent.trim()}
                          >
                            Save Memory
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <Divider className="my-4" />

              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : memories.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-gray-500">
                  <Brain className="mb-3 h-12 w-12 opacity-30" />
                  <p>No memories yet</p>
                  <p className="text-sm">
                    Start a conversation and I'll remember important details
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memories.map((memory) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Card className="transition-shadow hover:shadow-md">
                        <CardBody className="flex flex-row items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm">{memory.content}</p>
                            {memory.created_at && (
                              <p className="mt-1 text-xs text-gray-500">
                                {new Date(
                                  memory.created_at,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteMemory(memory.id)}
                            isLoading={deletingId === memory.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    size="sm"
                    color="primary"
                    variant="flat"
                  />
                </div>
              )}
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
