import { ScrollShadow } from "@heroui/scroll-shadow";
import { AnimatePresence, motion } from "framer-motion";
import { Hash } from "lucide-react";
import React, { useMemo, useState } from "react";

import { SlashCommandMatch } from "@/features/chat/hooks/useSlashCommands";
import { getToolCategoryIcon } from "@/features/chat/utils/toolIcons";

interface SlashCommandDropdownProps {
  matches: SlashCommandMatch[];
  selectedIndex: number;
  onSelect: (tool: SlashCommandMatch) => void;
  onClose: () => void;
  position: { top: number; left: number; width?: number };
  isVisible: boolean;
}

const formatToolName = (toolName: string): string => {
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const SlashCommandDropdown: React.FC<SlashCommandDropdownProps> = ({
  matches,
  selectedIndex,
  onSelect,
  onClose,
  position,
  isVisible,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories from matches
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(matches.map((match) => match.tool.category)),
    );
    return ["all", ...uniqueCategories.sort()];
  }, [matches]);

  // Filter matches based on selected category
  const filteredMatches = useMemo(() => {
    if (selectedCategory === "all") return matches;
    return matches.filter((match) => match.tool.category === selectedCategory);
  }, [matches, selectedCategory]);

  return (
    <AnimatePresence>
      {isVisible && matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300,
            duration: 0.15,
          }}
          className="slash-command-dropdown fixed z-[100] overflow-hidden rounded-2xl border-1 border-zinc-700 bg-zinc-900/60 shadow-2xl backdrop-blur-2xl"
          style={{
            top: position.top,
            left: position.left,
            width: position.width || "auto",
            minWidth: position.width ? "unset" : "320px",
            maxWidth: position.width ? "unset" : "384px",
            boxShadow: "0px -18px 30px 5px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ScrollShadow orientation="horizontal" className="overflow-x-auto">
              <div className="flex min-w-max gap-1 px-2 py-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                    }}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:bg-white/10 hover:text-zinc-300"
                    }`}
                  >
                    {category === "all" ? (
                      <Hash
                        size={16}
                        strokeWidth={2}
                        className="text-gray-400"
                      />
                    ) : (
                      getToolCategoryIcon(category)
                    )}
                    <span className="capitalize">
                      {category === "all" ? "All" : category.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollShadow>
          </motion.div>

          {/* Tool List */}
          <ScrollShadow className="max-h-96 overflow-y-auto">
            <div className="py-2">
              {filteredMatches.map((match, index) => (
                <div
                  key={match.tool.name}
                  className={`relative mx-2 mb-1 cursor-pointer rounded-xl transition-all duration-150 ${
                    index === selectedIndex
                      ? "border border-zinc-600 bg-zinc-700/60"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                  onClick={() => onSelect(match)}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getToolCategoryIcon(match.tool.category)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm text-foreground-600">
                          {formatToolName(match.tool.name)}
                        </span>
                        {selectedCategory === "all" && (
                          <span className="rounded-full bg-zinc-600 px-2 py-0.5 text-xs text-zinc-200 capitalize">
                            {match.tool.category.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollShadow>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlashCommandDropdown;
