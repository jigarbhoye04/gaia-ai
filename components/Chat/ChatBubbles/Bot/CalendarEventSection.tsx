import { CalendarEventsList } from "./CalendarEventCard";

export default function CalendarEventSection({
  calendar_options,
}: {
  calendar_options: any;
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

  return <CalendarEventsList events={eventsArray} />;
}
