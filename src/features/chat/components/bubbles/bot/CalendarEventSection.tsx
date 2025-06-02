import { CalendarEvent } from "@/types/features/calendarTypes";
import { CalendarOptions } from "@/types/features/convoTypes";

import { CalendarEventsList } from "./CalendarEventCard";

export default function CalendarEventSection({
  calendar_options,
}: {
  calendar_options: CalendarOptions[];
}) {
  if (
    !calendar_options.every(
      (option) => option.start && option.end && option.summary,
    )
  ) {
    return (
      <div className="p-3 text-red-500">
        Error: Could not add Calendar event. Please try again later.
      </div>
    );
  }

  const calendarEvents: CalendarEvent[] = calendar_options.map((option) => ({
    summary: option.summary!,
    description: option.description || "",
    start: option.start!,
    end: option.end!,
  }));

  return <CalendarEventsList events={calendarEvents} disableAnimation={true} />;
}
