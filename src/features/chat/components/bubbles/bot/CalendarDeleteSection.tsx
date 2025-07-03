import React from "react";

import { CalendarDeleteOptions } from "@/types/features/convoTypes";

import { CalendarDeleteCard } from "./CalendarDeleteCard";

interface CalendarDeleteSectionProps {
  calendar_delete_options: CalendarDeleteOptions[];
}

export function CalendarDeleteSection({
  calendar_delete_options,
}: CalendarDeleteSectionProps) {
  if (!calendar_delete_options?.length) return null;

  return (
    <div className="w-full space-y-3">
      {calendar_delete_options.map((deleteOption, index) => (
        <CalendarDeleteCard
          key={`${deleteOption.event_id}-${index}`}
          deleteOption={deleteOption}
        />
      ))}
    </div>
  );
}
