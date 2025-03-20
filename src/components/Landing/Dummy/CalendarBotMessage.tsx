import { Button } from "@heroui/button";

import { CalendarAdd01Icon, Tick02Icon } from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";

interface Task {
  title: string;
  description: string;
  time: string;
}

interface CalendarBotMessageProps {
  tasks: Task[];
  addedEvents: number[];
  dummyAddToCalendar: (index: number) => void;
}

export function CalendarBotMessage({
  tasks,
  addedEvents,
  dummyAddToCalendar,
}: CalendarBotMessageProps) {
  return (
    <div>
      <AnimatedSection className="flex w-fit flex-col gap-1 rounded-2xl rounded-bl-none bg-zinc-800 p-4 pt-3">
        <div>Want to add these events to your Calendar?</div>
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex flex-col items-start gap-2 rounded-xl bg-zinc-900 p-3"
          >
            <div className="relative flex w-full flex-row items-start gap-3 overflow-hidden rounded-lg bg-primary/20 p-3">
              <div className="absolute inset-0 h-full w-1 bg-primary"></div>
              <div className="flex flex-1 flex-col gap-1 pl-1">
                <div className="font-medium leading-none">{task.title}</div>
                <div className="text-xs text-primary">{task.time}</div>
              </div>
            </div>
            <Button
              className="w-full"
              variant="faded"
              isDisabled={addedEvents.includes(index)}
              onPress={() => dummyAddToCalendar(index)}
            >
              {addedEvents.includes(index) ? (
                <Tick02Icon color={undefined} width={22} />
              ) : (
                <CalendarAdd01Icon color={undefined} width={22} />
              )}
              {addedEvents.includes(index) ? "Added event" : "Add to calendar"}
            </Button>
          </div>
        ))}
      </AnimatedSection>
    </div>
  );
}
