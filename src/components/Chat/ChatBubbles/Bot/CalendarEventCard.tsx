import { Button } from "@heroui/button";
import { useCallback, useState } from "react";

import {
  CalendarAdd01Icon,
  PencilEdit01Icon,
  Tick02Icon,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { openModal } from "@/redux/slices/calendarModalSlice";
import {
  CalendarEvent,
  EventCardProps,
  TimedEvent,
  UnifiedCalendarEventsListProps,
} from "@/types/calendarTypes";
import { parsingDate } from "@/utils/fetchDate";
import { useDispatch } from "react-redux";

const isTimedEvent = (event: CalendarEvent): event is TimedEvent =>
  "start" in event && "end" in event;

export function CalendarEventCard({
  event,
  isDummy,
  onDummyAddEvent,
}: EventCardProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "added">("idle");
  const dispatch = useDispatch();

  const handleEditPress = useCallback(() => {
    dispatch(
      openModal({
        event,
        isDummy,
        onSuccess: () => {
          console.log("Event added");
          setStatus("added");
          onDummyAddEvent?.();
        },
      }),
    );
  }, [event, isDummy, onDummyAddEvent, dispatch]);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-3">
      <div className="relative flex w-full flex-row gap-3 overflow-hidden rounded-lg bg-primary/20 p-3 pr-1 pt-1">
        <div className="absolute inset-0 w-1 bg-primary" />
        <div className="flex flex-1 flex-col pl-1">
          <div className="flex w-full items-center justify-between">
            <div className="font-medium">{event.summary}</div>
            {/* <div
              onClick={() => {
                console.log("Test 1");
                handleEditPress();
              }}
            >
              onclick
            </div> */}
            <Button
              isIconOnly
              onPress={() => {
                console.log("Test 1");
                handleEditPress();
              }}
              className="z-10"
              size="sm"
              variant="light"
              color="primary"
            >
              <PencilEdit01Icon width={20} color={undefined} />
            </Button>
          </div>
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
        onPress={handleEditPress}
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
