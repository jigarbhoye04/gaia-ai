"use client";

import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { Calendar, X } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/shadcn/dropdown-menu";

import BaseFieldChip from "./BaseFieldChip";

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
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);

    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";

    return format(date, "MMM d");
  };

  const displayValue = value ? formatDisplayDate(value) : undefined;

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

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    onChange(
      date.toISOString(),
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  };

  return (
    <BaseFieldChip
      label="Due Date"
      value={displayValue}
      placeholder="Due date"
      icon={<Calendar size={14} />}
      variant={value ? "success" : "default"}
      className={className}
    >
      {/* Date picker section */}
      <div className="border-0 bg-zinc-900 p-3">
        <div className="">
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Select date
          </label>
          <DatePicker
            value={
              value ? (parseDate(value.split("T")[0]) as never) : undefined
            }
            onChange={handleDateChange}
            granularity="day"
            size="sm"
            variant="flat"
            hideTimeZone
            className="w-full border-0"
            classNames={{
              base: "border-0",
              input: "border-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-200",
              popoverContent: "border-0 bg-zinc-900 shadow-xl",
            }}
          />
        </div>
      </div>

      {/* Quick date options */}
      <DropdownMenuItem
        onClick={() => handleQuickDate(0)}
        className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
      >
        <Calendar size={14} />
        Today
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleQuickDate(1)}
        className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
      >
        <Calendar size={14} />
        Tomorrow
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleQuickDate(3)}
        className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
      >
        <Calendar size={14} />
        In 3 days
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleQuickDate(7)}
        className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
      >
        <Calendar size={14} />
        Next week
      </DropdownMenuItem>

      {/* Clear date option */}
      {value && (
        <>
          <DropdownMenuSeparator className="border-0 bg-zinc-700" />
          <DropdownMenuItem
            onClick={() => onChange(undefined, undefined)}
            className="cursor-pointer gap-2 border-0 text-red-400 outline-none hover:bg-zinc-800 focus:outline-none"
          >
            <X size={14} />
            Clear date
          </DropdownMenuItem>
        </>
      )}
    </BaseFieldChip>
  );
}
