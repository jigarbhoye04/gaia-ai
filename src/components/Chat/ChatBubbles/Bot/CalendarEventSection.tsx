import { CalendarEvent } from "@/types/calendarTypes";
import { CalendarOptions } from "@/types/convoTypes";

import { CalendarEventsList } from "./CalendarEventCard";

export default function CalendarEventSection({
  calendar_options,
}: {
  calendar_options: CalendarOptions | CalendarOptions[];
}) {
  const eventsArray = Array.isArray(calendar_options)
    ? calendar_options
    : [calendar_options];

  if (
    !eventsArray.every((option) => option.start && option.end && option.summary)
  ) {
    return (
      <div className="p-3 text-red-500">
        Error: Could not add Calendar event. Please try again later.
      </div>
    );
  }

  const calendarEvents: CalendarEvent[] = eventsArray.map((option) => ({
    summary: option.summary!,
    description: option.description || "",
    start: option.start!,
    end: option.end!,
  }));

  return <CalendarEventsList events={calendarEvents} disableAnimation={true} />;
}
