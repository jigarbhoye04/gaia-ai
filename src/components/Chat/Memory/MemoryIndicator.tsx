"use client";

import { Button } from "@heroui/react";
import { AnimatePresence,motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useEffect,useState } from "react";

import MemoryModal from "./MemoryModal";

interface MemoryResult {
  id: string;
  content: string;
  relevance_score?: number;
  metadata?: Record<string, unknown>;
}

interface MemoryItem {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

interface MemoryIndicatorProps {
  memoryData?: {
    operation?: string;
    status?: string;
    results?: MemoryResult[];
    memories?: MemoryItem[];
    count?: number;
    content?: string;
    memory_id?: string;
    error?: string;
  } | null;
  memoryOperation?: string | null;
  memoryStatus?: string | null;
}

export default function MemoryIndicator({
  memoryData,
  memoryOperation,
  memoryStatus,
}: MemoryIndicatorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayText, setDisplayText] = useState<string>("");
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Determine what text to display based on memory data
    if (memoryData) {
      const { operation, status, count } = memoryData;

      if (status === "success") {
        switch (operation) {
          case "create":
            setDisplayText("Created a memory");
            break;
          case "search":
            if (count === 0) {
              setDisplayText("No memories found");
            } else if (count === 1) {
              setDisplayText("Found 1 memory");
            } else {
              setDisplayText(`Found ${count} memories`);
            }
            break;
          case "list":
            if (count === 0) {
              setDisplayText("No memories");
            } else {
              setDisplayText(`Retrieved ${count} memories`);
            }
            break;
          default:
            setDisplayText("Memory operation completed");
        }
        setShowIndicator(true);
      }
    } else if (memoryOperation && memoryStatus) {
      // Handle in-progress operations
      if (memoryStatus === "storing") {
        setDisplayText("Storing memory...");
        setShowIndicator(true);
      } else if (memoryStatus === "searching") {
        setDisplayText("Searching memories...");
        setShowIndicator(true);
      } else if (memoryStatus === "retrieving") {
        setDisplayText("Retrieving memories...");
        setShowIndicator(true);
      }
    }

    // Auto-hide after 5 seconds for completed operations
    if (memoryData?.status === "success") {
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [memoryData, memoryOperation, memoryStatus]);

  if (!showIndicator && !displayText) return null;

  return (
    <>
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-2"
          >
            <Button
              size="sm"
              variant="flat"
              className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
              startContent={<Brain className="h-4 w-4" />}
              onPress={() => setIsModalOpen(true)}
            >
              {displayText}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <MemoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
