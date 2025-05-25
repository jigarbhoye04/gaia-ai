"use client";

import { Button, Card, CardBody, Pagination, Spinner } from "@heroui/react";
import { Brain, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import AddMemoryModal from "@/components/Memory/AddMemoryModal";
import { apiauth } from "@/utils/apiaxios";

export interface Memory {
  id: string;
  content: string;
  user_id: string;
  metadata?: Record<string, unknown>;
  categories?: string[];
  created_at?: string;
  updated_at?: string;
  expiration_date?: string | null;
  internal_metadata?: Record<string, unknown> | null;
  deleted_at?: string | null;
  relevance_score?: number | null;
}

export interface MemoryManagementProps {
  className?: string;
  onClose?: () => void;
  autoFetch?: boolean; // Whether to fetch on mount
  onFetch?: (memories: Memory[]) => void; // Callback when memories are fetched
}

export default function MemoryManagement({
  className = "",
  onClose,
  autoFetch = true,
  onFetch,
}: MemoryManagementProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMemories = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const response = await apiauth.get("memory", {
          params: { page, page_size: 10 },
        });

        setMemories(response.data.memories || []);
        setTotalPages(Math.ceil((response.data.total_count || 0) / 10));
        if (onFetch) {
          onFetch(response.data.memories || []);
        }
      } catch (error) {
        console.error("Error fetching memories:", error);
        toast.error("Failed to load memories");
      } finally {
        setLoading(false);
      }
    },
    [onFetch],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchMemories(currentPage);
    }
  }, [currentPage, autoFetch, fetchMemories]);

  const handleDeleteMemory = useCallback(
    async (memoryId: string) => {
      setDeletingId(memoryId);
      try {
        const response = await apiauth.delete(`memory/${memoryId}`);

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
    },
    [currentPage, fetchMemories],
  );

  const handleClearAll = useCallback(async () => {
    if (
      !confirm(
        "Are you sure you want to clear all memories? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await apiauth.delete("memory");

      if (response.data.success) {
        toast.success(response.data.message || "All memories cleared");
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
  }, []);

  const MemoryCard = useCallback(
    ({ memory }: { memory: Memory }) => {
      // Format date to be more readable
      const formattedDate = memory.created_at
        ? new Date(memory.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "";

      // Safely get conversation ID
      const conversationId =
        memory.metadata && typeof memory.metadata.conversation_id === "string"
          ? memory.metadata.conversation_id.substring(0, 8) + "..."
          : "";

      return (
        <div>
          <Card className="bg-zinc-800">
            <CardBody className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm">{memory.content}</p>
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
              </div>

              {/* Additional memory details */}
              <div className="flex w-full items-center justify-between text-xs text-gray-400">
                {formattedDate && <span>{formattedDate}</span>}

                {memory.categories && memory.categories.length > 0 && (
                  <div className="flex flex-wrap">
                    {memory.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-zinc-700 px-2 py-0.5"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      );
    },
    [handleDeleteMemory, deletingId],
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {onClose
            ? "GAIA remembers important information from our conversations"
            : "Manage the information GAIA remembers from your conversations"}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setIsAddMemoryModalOpen(true)}
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

      {/* Add Memory Modal */}
      <AddMemoryModal
        isOpen={isAddMemoryModalOpen}
        onClose={() => setIsAddMemoryModalOpen(false)}
        onMemoryAdded={() => fetchMemories(currentPage)}
      />

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Image
            alt="GAIA Logo"
            src={"/branding/logo.webp"}
            width={30}
            height={30}
            className={`animate-spin`}
          />
        </div>
      ) : memories.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-gray-500">
          <Brain className="mb-3 h-12 w-12 opacity-30" />
          <p>No memories yet</p>
          <p className="text-sm">
            Start a conversation and GAIA will remember important details
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
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
    </div>
  );
}
