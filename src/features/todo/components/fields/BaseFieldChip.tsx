"use client";

import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { cn } from "@heroui/theme";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface BaseFieldChipProps {
  label: string;
  value?: string | React.ReactElement;
  placeholder: string;
  icon?: React.ReactElement;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  isActive?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children: React.ReactNode; // Dropdown content
  className?: string;
}

export default function BaseFieldChip({
  label,
  value,
  placeholder,
  icon,
  variant = "default",
  isActive = false,
  onOpenChange,
  children,
  className,
}: BaseFieldChipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      placement="bottom-start"
      offset={4}
    >
      <DropdownTrigger>
        <Button
          variant={hasValue ? "flat" : "bordered"}
          color={hasValue ? variant : "default"}
          size="sm"
          className={cn(
            "h-8 min-w-0 gap-1 px-3 font-normal transition-all",
            isOpen && "ring-2 ring-primary/20",
            isActive && "ring-2 ring-primary/30",
            !hasValue && "text-default-500",
            className,
          )}
          startContent={icon}
          endContent={
            <ChevronDown
              size={14}
              className={cn("transition-transform", isOpen && "rotate-180")}
            />
          }
        >
          <span className="truncate">
            {hasValue ? (
              typeof value === "string" ? (
                value
              ) : (
                value
              )
            ) : (
              <span className="text-default-400">{placeholder}</span>
            )}
          </span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label={`${label} options`}
        className="min-w-[200px]"
        disallowEmptySelection={false}
      >
        {children}
      </DropdownMenu>
    </Dropdown>
  );
}
