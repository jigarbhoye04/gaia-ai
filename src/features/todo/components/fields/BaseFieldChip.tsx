"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { cn } from "@/lib/utils";

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
  children: React.ReactNode;
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

  // Flat design with consistent zinc background
  const getButtonClassName = () => {
    const baseClasses = "border-0 shadow-none outline-none focus:outline-none";

    if (hasValue) {
      switch (variant) {
        case "success":
          return `${baseClasses} bg-zinc-800 text-green-400 hover:bg-zinc-700`;
        case "primary":
          return `${baseClasses} bg-zinc-800 text-blue-400 hover:bg-zinc-700`;
        case "warning":
          return `${baseClasses} bg-zinc-800 text-yellow-400 hover:bg-zinc-700`;
        case "danger":
          return `${baseClasses} bg-zinc-800 text-red-400 hover:bg-zinc-700`;
        default:
          return `${baseClasses} bg-zinc-800 text-zinc-200 hover:bg-zinc-700`;
      }
    }
    return `${baseClasses} bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-400`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 min-w-0 gap-1 border-0 px-3 font-normal ring-0 transition-all outline-none focus:ring-0 focus:outline-none",
            isOpen && "ring-0",
            isActive && "ring-0",
            !hasValue && "text-zinc-500",
            getButtonClassName(),
            className,
          )}
        >
          {icon}
          <span className="max-w-[120px] truncate">
            {hasValue ? (
              typeof value === "string" ? (
                value
              ) : (
                value
              )
            ) : (
              <span className="text-zinc-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[200px] rounded-lg border-0 bg-zinc-900 shadow-xl backdrop-blur-none">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
