"use client";

import { DropdownItem } from "@heroui/dropdown";
import { Flag } from "lucide-react";

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
        <DropdownItem
          key={option.value}
          onPress={() => onChange(option.value)}
          className="gap-2"
          startContent={<Flag size={14} />}
          color={option.color}
        >
          {option.label}
        </DropdownItem>
      ))}
    </BaseFieldChip>
  );
}
