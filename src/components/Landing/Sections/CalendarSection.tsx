import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Tab, Tabs } from "@heroui/tabs";
import { useState } from "react";

import CalendarCard from "@/components/Calendar/CalendarCard";
import {
  BubbleConversationChatIcon,
  Calendar01Icon,
  CalendarAdd01Icon,
  GoogleCalendar,
} from "@/components/Misc/icons";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { CalendarEvent } from "@/types/calendarTypes";

import CalendarMessages from "../Dummy/CalendarMessages";

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
          <ScrollShadow className="h-[500px]">
            <div className="z-[1] w-full overflow-hidden rounded-3xl bg-gradient-to-bl sm:px-5">
              <CalendarMessages
                events={events}
                addedEvents={addedEvents}
                setAddedEvents={setAddedEvents}
              />
            </div>
          </ScrollShadow>
        </div>
      </div>
    </AnimatedSection>
  );
}
