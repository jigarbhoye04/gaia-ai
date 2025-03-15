import CalendarCard from "@/components/Calendar/CalendarCard";
import {
  BubbleConversationChatIcon,
  Calendar01Icon,
  CalendarAdd01Icon,
  GoogleCalendar,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tab, Tabs } from "@heroui/tabs";
import { useState } from "react";
import CalendarMessages from "../Dummy/CalendarMessages";
import { CalendarEvent } from "@/types/calendarTypes";

export default function Section_Calendar() {
  const [addedEvents, setAddedEvents] = useState<number[]>([]);
  const [openedCalendar, setOpenedCalendar] = useState(false);

  const events: CalendarEvent[] = [
    {
      summary: "Finish Landing Page",
      description: "Work on SaaS landing page design",
      time: "Today, 9:00 AM - 11:00 AM",
      organizer: { email: "organizer@heygaia.io" },
    },
    {
      summary: "Write Marketing Blog Post",
      description: "Work on content for marketing",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 11:30 AM - 1:00 PM",
    },
    {
      summary: "Gym Session",
      description: "Workout and exercise",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 1:30 PM - 2:30 PM",
    },
    {
      summary: "Exam Preparation",
      description: "Study for the upcoming exam",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 2:30 PM - 3:45 PM",
    },
    {
      summary: "Client Call",
      description: "Meeting with client",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 4:00 PM - 5:00 PM",
    },
    {
      summary: "Solve 3 DSA Problems",
      description: "Practice DSA for coding prep",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 5:30 PM - 6:30 PM",
    },
    {
      summary: "Client Call",
      description: "Evening meeting with client",
      organizer: { email: "organizer@heygaia.io" },
      time: "Today, 7:00 PM - 8:00 PM",
    },
  ];

  return (
    <AnimatedSection className="w-screen justify-center items-center flex z-[1] relative"
      disableAnimation={false}
    >
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
                <div className="w-full overflow-hidden bg-gradient-to-bl sm:px-5 rounded-3xl z-[1]">
                  <CalendarMessages
                    events={events}
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
                  <Calendar01Icon className="mr-2" />
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
                  {events
                    .map((task, index) => ({ ...task, index })) // add index to each event
                    .filter(({ index }) => addedEvents.includes(index)) // filter only added events
                    .map((event) => (
                      <CalendarCard
                        key={event.index}
                        event={event}
                        calendars={[
                          {
                            id: "organizer@heygaia.io",
                            backgroundColor: "#00bbff",
                            primary: true,
                            summary: "lorem ipsum",
                          },
                        ]}
                        onClick={() => {
                          // Handle the calendar card click if needed
                        }}
                      />
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
