import { Button } from "@heroui/button";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { CalendarAdd01Icon, Tick02Icon } from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import {
  CalendarEvent,
  EventCardProps,
  TimedEvent,
  UnifiedCalendarEventsListProps,
} from "@/types/calendarTypes";
import { apiauth } from "@/utils/apiaxios";
import { parsingDate } from "@/utils/fetchDate";

const isTimedEvent = (event: CalendarEvent): event is TimedEvent =>
  "start" in event && "end" in event;

export function CalendarEventCard({
  event,
  isDummy,
  onDummyAddEvent,
}: EventCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "added">("idle");

  const handleAddEvent = useCallback(async () => {
    if (isDummy) {
      setStatus("loading");
      setTimeout(() => {
        toast.success("Event added!", { description: event.description });
        setStatus("added");
        onDummyAddEvent?.();
      }, 300);
      return;
    }

    if (!isTimedEvent(event)) {
      toast.error("Real events require start and end times.");
      return;
    }

    setStatus("loading");
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await apiauth.post("/calendar/event", {
        ...event,
        timezone: userTimeZone,
      });
      toast.success("Added event to calendar!", {
        description: event.description,
      });
      setStatus("added");
    } catch (error) {
      toast.error("Failed to add event!");
      console.error(error);
    } finally {
      setStatus("idle");
    }
  }, [event, isDummy, onDummyAddEvent]);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-3">
      <div className="relative flex w-full flex-row gap-3 overflow-hidden rounded-lg bg-primary/20 p-3">
        <div className="absolute inset-0 w-1 bg-primary" />
        <div className="flex flex-1 flex-col gap-1 pl-1">
          <div className="font-medium">{event.summary}</div>
          <div className="text-xs text-primary">
            {isTimedEvent(event) ? (
              <>
                <div className="flex items-center">
                  <span className="w-9 min-w-9 font-medium">Start: </span>
                  {parsingDate(event.start)}
                </div>

                <div className="flex items-center">
                  <span className="w-9 min-w-9 font-medium">End: </span>
                  {parsingDate(event.end)}
                </div>
              </>
            ) : (
              event.time
            )}
          </div>
        </div>
      </div>
      <Button
        className="w-full"
        variant="faded"
        isDisabled={status === "added"}
        isLoading={status === "loading"}
        onPress={handleAddEvent}
      >
        {status === "added" ? (
          <Tick02Icon width={22} />
        ) : (
          <CalendarAdd01Icon width={22} />
        )}
        {status === "added" ? "Added" : "Add to calendar"}
      </Button>
    </div>
  );
}

export function CalendarEventsList({
  events,
  isDummy = false,
  onDummyAddEvent,
  disableAnimation = false,
}: UnifiedCalendarEventsListProps) {
  return (
    <AnimatedSection
      disableAnimation={disableAnimation}
      className={`flex w-fit flex-col gap-1 rounded-2xl rounded-bl-none bg-zinc-800 p-4 pt-3 ${
        disableAnimation ? "mt-3" : ""
      }`}
    >
      <div>
        Would you like to add{" "}
        {events.length === 1 ? "this event" : "these events"} to your Calendar?
      </div>{" "}
      {events.map((event, index) => (
        <CalendarEventCard
          key={index}
          event={event}
          isDummy={isDummy}
          onDummyAddEvent={() => onDummyAddEvent?.(index)}
        />
      ))}
    </AnimatedSection>
  );
}
