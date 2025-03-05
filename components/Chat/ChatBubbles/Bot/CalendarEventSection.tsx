// CalendarEventSection.tsx
import CalendarEventCard from "./CalendarEventCard";

interface CalendarEventSectionProps {
  calendar_options: any; // adjust type as needed
}

export default function CalendarEventSection({
  calendar_options,
}: CalendarEventSectionProps) {
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

  return (
    <div className="p-3 bg-zinc-800 rounded-2xl mt-2 flex gap-1 flex-col w-full">
      <div>
        Would you like to add{" "}
        {eventsArray.length === 1 ? "this event" : "these events"} to your
        Calendar?
      </div>
      {eventsArray.map((option, index) => (
        <CalendarEventCard key={index} option={option} />
      ))}
    </div>
  );
}
