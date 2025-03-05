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
            className="bg-zinc-900 p-3 flex rounded-xl items-start gap-3 flex-col"
          >
            <div className="flex flex-row rounded-xl items-start gap-3">
              <GoogleCalendar height={35} width={25} />
              <div className="flex flex-col flex-1 gap-1">
                <div className="font-medium leading-none">{task.title}</div>
                {/* <div className="text-sm">{task.description}</div> */}
                <div className="text-xs text-foreground-500">{task.time}</div>
              </div>
            </div>

            <Button
              className="w-full"
              color="primary"
              isDisabled={addedEvents.includes(index)}
              onPress={() => dummyAddToCalendar(index)}
            >
              {addedEvents.includes(index) ? (
                <Tick02Icon color={undefined} width={22} />
              ) : (
                <CalendarAdd01Icon color={undefined} width={22} />
              )}
              {addedEvents.includes(index) ? "Added Event" : "Add Event"}
            </Button>
          </div>
        ))}
      </AnimatedSection>
    </div>
  );
}
