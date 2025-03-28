import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tab, Tabs } from "@heroui/tabs";
import { useState } from "react";

import CalendarCard from "@/components/Calendar/CalendarCard";
import {
  BubbleConversationChatIcon,
  Calendar01Icon,
  CalendarAdd01Icon,
  GoogleCalendar as GoogleCalendarIcon,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { CalendarEvent, GoogleCalendar } from "@/types/calendarTypes";

import CalendarMessages from "../Dummy/CalendarMessages";
import { Chip } from "@heroui/chip";

export default function Section_Calendar() {
  const [addedEvents, setAddedEvents] = useState<number[]>([]);
  const [openedCalendar, setOpenedCalendar] = useState(false);
  const [selectedTab, setSelectedTab] = useState("chat");

  const dummyCalendars: GoogleCalendar[] = [
    {
      id: "work@heygaia.io",
      summary: "Work",
      backgroundColor: "#00bbff",
      primary: true,
    },
    {
      id: "personal@heygaia.io",
      summary: "Personal",
      backgroundColor: "#7c4dff",
      primary: false,
    },
    {
      id: "organizer@heygaia.io",
      summary: "Added Events",
      backgroundColor: "#00bbff",
      primary: false,
    },
  ];

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

  const defaultEvents: CalendarEvent[] = [
    {
      summary: "Dentist Appointment",
      description: "Regular checkup",
      time: "March 30, 2:00 PM - 3:00 PM",
      organizer: { email: "personal@heygaia.io" },
    },
    {
      summary: "Mom's Birthday",
      description: "Don't forget to buy a gift!",
      time: "April 27, All day",
      organizer: { email: "personal@heygaia.io" },
    },
  ];

  return (
    <AnimatedSection className="relative z-[1] flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col items-start justify-evenly space-x-5 sm:flex-row sm:space-x-10">
        <SectionHeading
          className="w-full"
          heading={"Effortless Time Management"}
          chipTitle={"Calendar"}
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
                startContent={<GoogleCalendarIcon width={23} />}
                variant="flat"
              >
                Integrated with Google Calendar
              </Button>
            </div>
          }
        />

        <div className="!m-0 !mt-0 w-full px-2 sm:px-10">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            className="mb-4"
            color="primary"
            fullWidth
            variant="underlined"
          >
            <Tab
              key="chat"
              title={
                <div className="flex items-center gap-2">
                  <BubbleConversationChatIcon
                    className="h-4 w-4"
                    color={undefined}
                  />
                  <span>Chat</span>
                </div>
              }
            />
            <Tab
              key="calendar"
              title={
                <div className="flex items-center gap-2">
                  <Calendar01Icon className="h-4 w-4" color={undefined} />
                  <span>Calendar</span>
                  {addedEvents.length > 0 && (
                    <Chip size="sm" color="primary" variant="flat">
                      {addedEvents.length}
                    </Chip>
                  )}
                </div>
              }
            />
          </Tabs>

          <ScrollShadow className="h-[500px]">
            <div className="z-[1] w-full overflow-hidden rounded-3xl bg-gradient-to-bl sm:px-5">
              {selectedTab === "chat" ? (
                <CalendarMessages
                  events={events}
                  addedEvents={addedEvents}
                  setAddedEvents={setAddedEvents}
                />
              ) : (
                <div className="space-y-4 p-4">
                  {defaultEvents.map((event, index) => (
                    <CalendarCard
                      key={`default-${index}`}
                      event={event}
                      onClick={() => {}}
                      calendars={dummyCalendars}
                    />
                  ))}

                  {addedEvents.map((eventIndex) => (
                    <CalendarCard
                      key={`added-${eventIndex}`}
                      event={events[eventIndex]}
                      onClick={() => {}}
                      calendars={dummyCalendars}
                    />
                  ))}

                  {addedEvents.length === 0 && defaultEvents.length === 0 && (
                    <div className="flex h-40 flex-col items-center justify-center text-center text-gray-500">
                      <Calendar01Icon className="mb-4 h-12 w-12 opacity-50" />
                      <p className="text-lg font-medium">No events scheduled</p>
                      <p className="mt-2">
                        Add events using the chat interface
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollShadow>
        </div>
      </div>
    </AnimatedSection>
  );
}
