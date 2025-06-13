"use client";

import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { cn } from "@heroui/theme";
import { ChevronDown,Hash, Plus, X } from "lucide-react";
import { useState } from "react";

interface LabelsFieldChipProps {
  value: string[];
  onChange: (labels: string[]) => void;
  className?: string;
}

export default function LabelsFieldChip({
  value = [],
  onChange,
  className,
}: LabelsFieldChipProps) {
  const [newLabel, setNewLabel] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const displayValue =
    value.length > 0
      ? `${value.length} label${value.length > 1 ? "s" : ""}`
      : undefined;
  const hasValue = value.length > 0;

  const handleAddLabel = () => {
    const trimmedLabel = newLabel.trim();
    if (trimmedLabel && !value.includes(trimmedLabel)) {
      onChange([...value, trimmedLabel]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    onChange(value.filter((label) => label !== labelToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLabel();
    }
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-start"
      offset={4}
    >
      <DropdownTrigger>
        <div
          className={cn(
            "flex h-8 min-w-0 cursor-pointer items-center gap-1 rounded-md border border-default-200 px-3 font-normal transition-all hover:border-default-300",
            isOpen && "ring-2 ring-primary/20",
            hasValue
              ? "border-primary/20 bg-primary/10 text-primary-700"
              : "bg-default-50 text-default-500",
            className,
          )}
        >
          <Hash size={14} />
          <span className="flex-1 truncate text-sm">
            {hasValue ? (
              displayValue
            ) : (
              <span className="text-default-400">Labels</span>
            )}
          </span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Labels options"
        className="min-w-[250px]"
        disallowEmptySelection={false}
      >
        <div className="p-3">
          {/* Add new label */}
          <div className="mb-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                size="sm"
                className="flex-1"
                startContent={<Hash size={14} />}
              />
              <div
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                  !newLabel.trim() || value.includes(newLabel.trim())
                    ? "border-default-200 text-default-400"
                    : "border-primary text-primary hover:bg-primary/10"
                }`}
                onClick={handleAddLabel}
              >
                <Plus size={14} />
              </div>
            </div>
          </div>

          {/* Existing labels */}
          {value.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-default-600">
                Current labels:
              </div>
              <div className="flex flex-wrap gap-1">
                {value.map((label) => (
                  <Chip
                    key={label}
                    size="sm"
                    variant="flat"
                    onClose={() => handleRemoveLabel(label)}
                    startContent={<Hash size={12} />}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          {value.length > 0 && (
            <>
              <div className="mt-3 border-t border-divider pt-2" />
              <DropdownItem
                onPress={() => onChange([])}
                className="gap-2 text-danger"
                color="danger"
                startContent={<X size={14} />}
              >
                Clear all labels
              </DropdownItem>
            </>
          )}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
}
