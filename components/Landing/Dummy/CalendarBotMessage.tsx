import {
  CalendarAdd01Icon,
  GoogleCalendar,
  Tick02Icon,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { Button } from "@heroui/button";

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
      <AnimatedSection className="p-4 pt-3 bg-zinc-800 rounded-2xl rounded-bl-none flex flex-col gap-1 w-fit">
        <div>Want to add these events to your Calendar?</div>

        {tasks.map((task, index) => (
          <div
            key={index}
            className="bg-zinc-900 p-3 flex rounded-xl items-start gap-2 flex-col"
          >
            <div className="flex flex-row rounded-lg items-start gap-3 bg-primary/20 w-full p-3 relative overflow-hidden">
              <div className="bg-primary h-full w-1 absolute inset-0"></div>
              <div className="flex flex-col flex-1 gap-1 pl-1">
                <div className="font-medium leading-none">{task.title}</div>
                <div className="text-xs text-primary">{task.time}</div>
              </div>
            </div>

            <Button
              className="w-full"
              // color="primary"
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
