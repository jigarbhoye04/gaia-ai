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
    <AnimatedSection className="relative z-[1] flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col items-start justify-evenly space-x-5 sm:flex-row sm:space-x-10">
        <SectionHeading
          className="w-full"
          heading={"Manage your Calendar"}
          icon={
            <CalendarAdd01Icon
              className="h-[40px] w-[35px] sm:h-[40px] sm:w-[40px]"
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
                className="mt-4 w-fit cursor-default text-foreground-600"
                radius="full"
                startContent={<GoogleCalendar width={23} />}
                variant="flat"
              >
                Integrated with Google Calendar
              </Button>
            </div>
          }
        />

        <div className="!m-0 !mt-0 w-full px-2 sm:px-10">
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
                <div className="z-[1] w-full overflow-hidden rounded-3xl bg-gradient-to-bl sm:px-5">
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
                      <div className="absolute -right-2 -top-[2px] min-h-2 min-w-2 rounded-full bg-red-500" />
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
                <div className="flex h-[500px] w-full items-center justify-center p-5 text-white">
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
