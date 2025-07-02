import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

import { getToolCategoryIcon } from "@/features/chat/utils/toolIcons";

interface SelectedToolIndicatorProps {
  toolName: string | null;
  toolCategory?: string | null;
  onRemove: () => void;
}

const formatToolName = (toolName: string): string => {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const SelectedToolIndicator: React.FC<SelectedToolIndicatorProps> = ({
  toolName,
  toolCategory,
  onRemove,
}) => {
  return (
    <AnimatePresence>
      {toolName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          // exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            duration: 0.2,
          }}
          className="mx-3 mt-2 mb-1 flex w-fit items-center gap-2 rounded-lg bg-zinc-700 px-2 py-1.5 outline-1 outline-zinc-600"
        >
          <div>
            {getToolCategoryIcon(toolCategory || "general", {
              size: 17,
              className: "text-zinc-300",
            })}
          </div>
          <span className="text-sm font-light text-zinc-200">
            {formatToolName(toolName)}
          </span>

          <motion.button
            onClick={onRemove}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-4 w-4 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-200"
          >
            <X size={10} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SelectedToolIndicator;
