import { Chip, ScrollShadow, Tab, Tabs } from "@heroui/react";
import { CheckCircle } from "lucide-react";
import { useState } from "react";

import {
  BubbleConversationChatIcon,
  Calendar01Icon,
  GoogleCalendarIcon,
} from "@/components";
import CalendarCard from "@/features/calendar/components/CalendarCard";
import { CalendarItem } from "@/types";

import CalendarMessages from "../../demo/CalendarMessages";
import { FeatureCard } from "../../shared/FeatureCard";
import LargeHeader from "../../shared/LargeHeader";
import { CalendarEvent } from "@/types/features/calendarTypes";

const calendarTools: string[] = [
  "Create calendar events using natural language",
  "Edit event details like title, time, and location",
  "Delete calendar events instantly with a message",
  "Search your calendar for events using keywords",
  "View upcoming events in a clean, summarized list",
  "Get an overview of all your connected calendars",
  "See full details of any scheduled event",
];

export default function Calendar() {
  const [addedEvents, setAddedEvents] = useState<number[]>([]);
  const [selectedTab, setSelectedTab] = useState("chat");
  const dummyCalendars: CalendarItem[] = [
    {
      id: "work@heygaia.io",
      name: "Work",
      summary: "Work",
      backgroundColor: "#00bbff",
      primary: true,
    },
    {
      id: "personal@heygaia.io",
      name: "Personal",
      summary: "Personal",
      backgroundColor: "#7c4dff",
      primary: false,
    },
    {
      id: "organizer@heygaia.io",
      name: "Added Events",
      summary: "Added Events",
      backgroundColor: "#00bbff",
      primary: false,
    },
  ];

  const events: CalendarEvent[] = [
    {
      summary: "Finish landing Page",
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
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        chipText="Calendar"
        headingText="Effortless Time Management"
        subHeadingText={
          "No need to ever open your Calendar again. Easily schedule, update, and manage your schedule just by texting GAIA. "
        }
      />
      <div className="grid h-full w-full max-w-6xl grid-cols-4 gap-5">
        <div className="col-span-2">
          <FeatureCard
            title="Your Calendar, Powered by Conversation"
            description="Control Your Entire Schedule with Just a Text"
          >
            <div className="px-5">
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

              <ScrollShadow className="h-[400px]">
                <div className="z-1 w-full overflow-hidden rounded-3xl bg-linear-to-bl">
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

                      {addedEvents.length === 0 &&
                        defaultEvents.length === 0 && (
                          <div className="flex h-40 flex-col items-center justify-center text-center text-gray-500">
                            <Calendar01Icon className="mb-4 h-12 w-12 opacity-50" />
                            <p className="text-lg font-medium">
                              No events scheduled
                            </p>
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
          </FeatureCard>
        </div>

        <div className="col-span-2">
          <FeatureCard
            title={`${calendarTools.length}+ Calendar Tools`}
            description="Stop wasting time organising to-do lists — GAIA turns your words into action instantly"
          >
            <div className="mt-5 flex flex-col items-center justify-center gap-3">
              {calendarTools.map((tool, index) => (
                <div
                  key={index}
                  className="flex w-full max-w-110 items-center gap-3 rounded-2xl bg-zinc-800 px-3 py-3"
                >
                  <CheckCircle className="text-primary" />
                  <div className="text-medium font-medium text-zinc-300">
                    {tool}
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>
        </div>

        <div className="col-span-4">
          <FeatureCard
            title="Integrated with Google Calendar"
            description="and many more integrations coming soon..."
            className="relative max-h-[130px] pt-6"
          >
            <div className="absolute top-0 right-0 flex h-full items-center justify-center p-8">
              <div className="flex aspect-square h-[90px] w-[90px] -rotate-6 items-center justify-center rounded-2xl bg-zinc-800 p-4 outline-2 outline-zinc-700 transition active:scale-90">
                <GoogleCalendarIcon width={65} height={65} />
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </div>
  );
}
