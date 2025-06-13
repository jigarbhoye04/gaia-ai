"use client";

import { Flag } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/shadcn/dropdown-menu";
import { Priority } from "@/types/features/todoTypes";

import BaseFieldChip from "./BaseFieldChip";

interface PriorityFieldChipProps {
  value?: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}

const priorityOptions = [
  { value: Priority.NONE, label: "None", color: "default" as const },
  { value: Priority.LOW, label: "Low", color: "primary" as const },
  { value: Priority.MEDIUM, label: "Medium", color: "warning" as const },
  { value: Priority.HIGH, label: "High", color: "danger" as const },
];

export default function PriorityFieldChip({
  value = Priority.NONE,
  onChange,
  className,
}: PriorityFieldChipProps) {
  const selectedOption = priorityOptions.find(
    (option) => option.value === value,
  );
  const displayValue =
    value === Priority.NONE ? undefined : selectedOption?.label;
  const variant = selectedOption?.color || "default";

  return (
    <BaseFieldChip
      label="Priority"
      value={displayValue}
      placeholder="Priority"
      icon={<Flag size={14} />}
      variant={variant}
      className={className}
    >
      {priorityOptions.map((option) => (
        <DropdownMenuItem
          key={option.value}
          onClick={() => onChange(option.value)}
          className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
        >
          <Flag
            size={14}
            className={
              option.value === Priority.HIGH
                ? "text-red-400"
                : option.value === Priority.MEDIUM
                  ? "text-yellow-400"
                  : option.value === Priority.LOW
                    ? "text-blue-400"
                    : "text-zinc-500"
            }
          />
          {option.label}
        </DropdownMenuItem>
      ))}
    </BaseFieldChip>
  );
}
