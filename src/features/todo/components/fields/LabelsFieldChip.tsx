"use client";

import { Hash, Plus, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { DropdownMenuItem } from "@/components/ui/shadcn/dropdown-menu";
import { Input } from "@/components/ui/shadcn/input";

import BaseFieldChip from "./BaseFieldChip";

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

  const displayValue =
    value.length > 0
      ? `${value.length} label${value.length > 1 ? "s" : ""}`
      : undefined;

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
    <BaseFieldChip
      label="Labels"
      value={displayValue}
      placeholder="Labels"
      icon={<Hash size={14} />}
      variant={value.length > 0 ? "primary" : "default"}
      className={className}
    >
      <div className="border-0 bg-zinc-900 p-3">
        {/* Add new label */}
        <div className="mb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 transform text-zinc-500"
              />
              <Input
                placeholder="Add label..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 border-0 bg-zinc-800 pl-8 text-sm text-zinc-200 placeholder:text-zinc-500 hover:bg-zinc-700 focus:ring-0 focus:outline-none"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={!newLabel.trim() || value.includes(newLabel.trim())}
              onClick={handleAddLabel}
              className={`h-8 w-8 border-0 p-0 ${
                !newLabel.trim() || value.includes(newLabel.trim())
                  ? "bg-zinc-800 text-zinc-600 hover:bg-zinc-700"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Existing labels */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {value.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="gap-1 border-0 bg-zinc-800 pr-1 text-zinc-300 hover:bg-zinc-700"
              >
                <Hash size={12} />
                {label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLabel(label)}
                  className="h-4 w-4 border-0 p-0 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
                >
                  <X size={10} />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      {value.length > 0 && (
        <>
          <DropdownMenuItem
            onClick={() => onChange([])}
            className="cursor-pointer gap-2 border-0 text-red-400 outline-none hover:bg-zinc-800 focus:outline-none"
          >
            <X size={14} />
            Clear all labels
          </DropdownMenuItem>
        </>
      )}
    </BaseFieldChip>
  );
}
