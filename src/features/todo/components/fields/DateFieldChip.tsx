"use client";

import { DatePicker } from "@heroui/date-picker";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { cn } from "@heroui/theme";
import { parseDate } from "@internationalized/date";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar, ChevronDown,X } from "lucide-react";
import { useState } from "react";

interface DateFieldChipProps {
  value?: string; // ISO date string
  onChange: (date?: string, timezone?: string) => void;
  className?: string;
}

export default function DateFieldChip({
  value,
  onChange,
  className,
}: DateFieldChipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";

    return format(date, "MMM d");
  };

  const displayValue = value ? formatDisplayDate(value) : undefined;
  const hasValue = value !== undefined && value !== null && value !== "";

  const handleDateChange = (date: unknown) => {
    if (
      date &&
      typeof date === "object" &&
      date !== null &&
      "year" in date &&
      "month" in date &&
      "day" in date
    ) {
      const d = date as { year: number; month: number; day: number };
      const jsDate = new Date(d.year, d.month - 1, d.day);
      onChange(
        jsDate.toISOString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );
    }
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined, undefined);
  };

  const quickDateOptions = [
    { label: "Today", days: 0 },
    { label: "Tomorrow", days: 1 },
    { label: "In 3 days", days: 3 },
    { label: "Next week", days: 7 },
  ];

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(
      date.toISOString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
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
              ? "border-success/20 bg-success/10 text-success-700"
              : "bg-default-50 text-default-500",
            className,
          )}
        >
          <Calendar size={14} />
          <span className="flex-1 truncate text-sm">
            {hasValue ? (
              <div className="flex items-center gap-1">
                <span>{displayValue}</span>
                <X
                  size={12}
                  className="cursor-pointer opacity-60 hover:opacity-100"
                  onClick={clearDate}
                />
              </div>
            ) : (
              <span className="text-default-400">Due date</span>
            )}
          </span>
          <ChevronDown
            size={14}
            className={cn("transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Due date options"
        className="min-w-[250px]"
        disallowEmptySelection={false}
      >
        <div className="space-y-3 p-3">
          {/* Date Input */}
          <div>
            <label className="mb-2 block text-xs font-medium text-default-600">
              Select date
            </label>
            <DatePicker
              value={value ? parseDate(value.split("T")[0]) : undefined}
              onChange={handleDateChange}
              granularity="day"
              size="sm"
              variant="flat"
              hideTimeZone
            />
          </div>

          {/* Quick Date Options */}
          <div>
            <div className="mb-2 text-xs font-medium text-default-600">
              Quick select:
            </div>
            <div className="space-y-1">
              {quickDateOptions.map((option) => (
                <DropdownItem
                  key={option.label}
                  onPress={() => handleQuickDate(option.days)}
                  className="gap-2"
                  startContent={<Calendar size={14} />}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </div>
          </div>

          {/* Clear Option */}
          {value && (
            <div>
              <DropdownItem
                key="clear"
                onPress={() => onChange(undefined, undefined)}
                className="gap-2 text-danger"
                color="danger"
                startContent={<X size={14} />}
              >
                Clear date
              </DropdownItem>
            </div>
          )}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
}
