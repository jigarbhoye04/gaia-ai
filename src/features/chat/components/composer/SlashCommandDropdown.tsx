import { Kbd } from "@heroui/kbd";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Code,
  FileText,
  Hash,
  Image,
  Mail,
  Search,
  Target,
  Thermometer,
  Zap,
} from "lucide-react";
import React, { useMemo,useState } from "react";

import { SlashCommandMatch } from "@/features/chat/hooks/useSlashCommands";

interface SlashCommandDropdownProps {
  matches: SlashCommandMatch[];
  selectedIndex: number;
  onSelect: (tool: SlashCommandMatch) => void;
  onClose: () => void;
  position: { top: number; left: number; width?: number };
  isVisible: boolean;
}

const getCategoryIcon = (category: string) => {
  const iconProps = { size: 16, strokeWidth: 2 };

  switch (category) {
    case "productivity":
      return <Target {...iconProps} className="text-emerald-400" />;
    case "communication":
      return <Mail {...iconProps} className="text-blue-400" />;
    case "search":
      return <Search {...iconProps} className="text-purple-400" />;
    case "calendar":
      return <Calendar {...iconProps} className="text-red-400" />;
    case "documents":
      return <FileText {...iconProps} className="text-orange-400" />;
    case "media":
      return <Image {...iconProps} className="text-pink-400" />;
    case "development":
      return <Code {...iconProps} className="text-cyan-400" />;
    case "information":
      return <Thermometer {...iconProps} className="text-yellow-400" />;
    case "memory":
      return <Zap {...iconProps} className="text-indigo-400" />;
    default:
      return <Hash {...iconProps} className="text-gray-400" />;
  }
};

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
          className="slash-command-dropdown fixed z-[100] overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
          style={{
            top: position.top,
            left: position.left,
            width: position.width || "auto",
            minWidth: position.width ? "unset" : "320px",
            maxWidth: position.width ? "unset" : "384px",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="border-b border-zinc-700/30 bg-zinc-800/50 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Tools</span>
              </div>
              <div className="hidden items-center gap-1 text-xs text-zinc-500 sm:flex">
                <Kbd className="border-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 text-xs">
                  ↑↓
                </Kbd>
                <Kbd className="border-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 text-xs">
                  ⏎
                </Kbd>
                <Kbd className="border-zinc-600 bg-zinc-800/60 px-1.5 py-0.5 text-xs">
                  esc
                </Kbd>
              </div>
            </div>
          </motion.div>

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="border-b border-zinc-700/30"
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
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-300"
                    }`}
                  >
                    {category !== "all" && getCategoryIcon(category)}
                    <span className="capitalize">
                      {category === "all" ? "All" : category}
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
                <motion.div
                  key={match.tool.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`relative mx-2 mb-1 cursor-pointer rounded-lg transition-all duration-150 ${
                    index === selectedIndex
                      ? "border border-zinc-600 bg-zinc-700/60"
                      : "border border-transparent hover:bg-zinc-800/40"
                  }`}
                  onClick={() => onSelect(match)}
                >
                  <div className="flex items-center gap-3 p-3">
                    {/* Icon */}
                    <motion.div
                      className="flex-shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      }}
                    >
                      {getCategoryIcon(match.tool.category)}
                    </motion.div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {formatToolName(match.tool.name)}
                        </span>
                        {selectedCategory === "all" && (
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">
                            {match.tool.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollShadow>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SlashCommandDropdown;
