import React from "react";

import { CalendarEditOptions } from "@/types/features/convoTypes";

import { CalendarEditCard } from "./CalendarEditCard";

interface CalendarEditSectionProps {
  calendar_edit_options: CalendarEditOptions[];
}

export function CalendarEditSection({
  calendar_edit_options,
}: CalendarEditSectionProps) {
  if (!calendar_edit_options?.length) return null;

  return (
    <div className="w-full space-y-3">
      {calendar_edit_options.map((editOption, index) => (
        <CalendarEditCard
          key={`${editOption.event_id}-${index}`}
          editOption={editOption}
        />
      ))}
    </div>
  );
}
