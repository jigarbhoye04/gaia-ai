import {
  BubbleConversationChatIcon,
  Calendar01Icon,
  CalendarAdd01Icon,
  GoogleCalendar,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { Button } from "@heroui/button";
import { Tab, Tabs } from "@heroui/tabs";
import { Clock } from "lucide-react";
import { useState } from "react";
import CalendarMessages from "../Dummy/CalendarMessages";
import { ScrollShadow } from "@heroui/scroll-shadow";

interface Task {
  title: string;
  description: string;
  time: string;
}

export default function Section_Calendar() {
  // Instead of a boolean, store an array of indices of added events
  const [addedEvents, setAddedEvents] = useState<number[]>([]);
  const [openedCalendar, setOpenedCalendar] = useState(false);

  const tasks: Task[] = [
    {
      title: "Finish Landing Page",
      description: "Work on SaaS landing page design",
      time: "Today, 9:00 AM - 11:00 AM",
    },
    {
      title: "Write Marketing Blog Post",
      description: "Work on content for marketing",
      time: "Today, 11:30 AM - 1:00 PM",
    },
    {
      title: "Gym Session",
      description: "Workout and exercise",
      time: "Today, 1:30 PM - 2:30 PM",
    },
    {
      title: "Exam Preparation",
      description: "Study for the upcoming exam",
      time: "Today, 2:30 PM - 3:45 PM",
    },
    {
      title: "Client Call",
      description: "Meeting with client",
      time: "Today, 4:00 PM - 5:00 PM",
    },
    {
      title: "Solve 3 DSA Problems",
      description: "Practice DSA for coding prep",
      time: "Today, 5:30 PM - 6:30 PM",
    },
    {
      title: "Client Call",
      description: "Evening meeting with client",
      time: "Today, 7:00 PM - 8:00 PM",
    },
  ];

  return (
    <AnimatedSection className="w-screen justify-center items-center flex z-[1] relative">
      <div className="max-w-screen-xl w-screen flex sm:flex-row flex-col justify-evenly items-start sm:space-x-10 space-x-5 ">
        <SectionHeading
          className="w-full"
          heading={"Manage your Calendar"}
          icon={
            <CalendarAdd01Icon
              className="sm:w-[40px] w-[35px] sm:h-[40px] h-[40px]"
              color="#9b9b9b"
            />
          }
          subheading={
            <div>
              <div>
                Easily schedule, update, and check events just by texting GAIA.
                <br />
                No need to open your calendar—add appointments, set reminders,
                and stay organized with a simple message!
              </div>
              <Button
                disableRipple
                className="w-fit cursor-default mt-4 text-foreground-600"
                radius="full"
                startContent={<GoogleCalendar width={23} />}
                variant="flat"
              >
                Integrated with Google Calendar
              </Button>
            </div>
          }
        />

        <div className="w-full sm:px-10 px-2 !m-0 !mt-0">
          <Tabs
            aria-label="GAIA Calendar Options"
            className="w-full"
            classNames={{
              tabList: "w-full",
              tabContent: "group-data-[selected=true]:text-black font-medium",
            }}
            color="primary"
            radius="full"
          >
            <Tab
              key="chat"
              title={
                <div className="flex items-center gap-2">
                  <BubbleConversationChatIcon
                    className="mr-2"
                    color={undefined}
                  />
                  New Chat
                </div>
              }
            >
              <ScrollShadow className="h-[500px]">
                <div className="w-full overflow-hidden bg-gradient-to-bl sm:px-10 rounded-3xl z-[1]">
                  <CalendarMessages
                    tasks={tasks}
                    addedEvents={addedEvents}
                    setAddedEvents={setAddedEvents}
                  />
                </div>
              </ScrollShadow>
            </Tab>

            <Tab
              key="calendar"
              title={
                <div
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (addedEvents.length > 0) setOpenedCalendar(true);
                  }}
                >
                  <Calendar01Icon className="mr-2" color={undefined} />
                  <div className="relative">
                    Your Calendar
                    {addedEvents.length > 0 && !openedCalendar && (
                      <div className="bg-red-500 min-h-2 min-w-2 rounded-full absolute -right-2 -top-[2px]" />
                    )}
                  </div>
                </div>
              }
            >
              {addedEvents.length > 0 ? (
                <ScrollShadow className="h-[500px] space-y-2">
                  {tasks
                    .map((task, index) => ({ ...task, index }))
                    .filter(({ index }) => addedEvents.includes(index))
                    .map(({ title, time, index }) => (
                      <div
                        key={index}
                        className="text-white bg-opacity-65 p-4 rounded-lg bg-blue-500/30 shadow-md cursor-pointer w-full transition-colors duration-200 relative z-[1] overflow-hidden flex items-start gap-3 pl-6"
                      >
                        <div className="min-h-[90%] min-w-1 bg-blue-500 rounded-full absolute top-[5px] left-[8px]" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 relative z-[1]">
                            <div className="font-bold text-lg">{title}</div>
                          </div>
                          <div className="text-sm mt-2 relative z-[1] flex items-center gap-1 text-blue-500">
                            <Clock height={18} width={18} />
                            {time}
                          </div>
                        </div>
                      </div>
                    ))}
                </ScrollShadow>
              ) : (
                <div className="text-white flex justify-center items-center w-full p-5 h-[500px]">
                  No events added yet.
                </div>
              )}
            </Tab>
          </Tabs>
        </div>
      </div>
    </AnimatedSection>
  );
}
