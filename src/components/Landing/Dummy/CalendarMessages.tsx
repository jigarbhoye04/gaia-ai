import { CalendarEventsList } from "@/components/Chat/ChatBubbles/Bot/CalendarEventCard";
import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/components/Landing/Dummy/SimpleChatBubbles";
import { AnimatedSection } from "@/layouts/AnimatedSection";
import { CalendarEvent } from "@/types/calendarTypes";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

interface CalendarMessagesProps {
  events: CalendarEvent[];
  addedEvents: number[];
  setAddedEvents: Dispatch<SetStateAction<number[]>>;
}

const ReadMoreText = ({
  children,
  maxHeight = 60,
}: {
  children: ReactNode;
  maxHeight: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  useEffect(() => {
    if (contentRef.current)
      setNeedsTruncation(contentRef.current.scrollHeight > maxHeight);
  }, [children]);

  return (
    <div className="">
      <div
        ref={contentRef}
        style={{ maxHeight: expanded ? "100%" : `${maxHeight}px` }}
        className={`overflow-hidden`}
      >
        {children}
      </div>
      {/* 
      {!expanded && needsTruncation && (
        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none rounded-r-3xl"></div>
      )} */}

      {needsTruncation && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 z-[2] relative text-sm text-primary font-medium hover:underline"
        >
          {expanded ? "Read Less" : "Read More"}...
        </button>
      )}
    </div>
  );
};

export default function CalendarMessages({
  events,
  addedEvents,
  setAddedEvents,
}: CalendarMessagesProps) {
  const addToCalendar = (index: number) => {
    setAddedEvents((prev) => (prev.includes(index) ? prev : [...prev, index]));
    toast.success(`${events[index].summary} has been added to Calendar!`);
  };

  return (
    <AnimatedSection className="flex flex-col gap-3 justify-between">
      <div className="flex justify-end w-full">
        <SimpleChatBubbleUser className="max-w-[90%]">
          {`I’ve got a busy day—need to finish a landing page, write a blog, do some DSA, study for an exam, hit the gym, and take client calls at 4 and 7 PM. Can you help me plan my day?`}
        </SimpleChatBubbleUser>
      </div>

      <div className="max-w-[90%] space-y-3">
        <SimpleChatBubbleBot className="whitespace-pre-wrap">
          <ReadMoreText maxHeight={45}>
            {`Got it! Start your morning with the landing page (9 AM - 12 PM). After lunch, do DSA (12:30 PM - 2 PM), write your blog (2 PM - 3:30 PM), and do a quick exam review (3:30 PM - 3:50 PM).  

Your client calls are at 4 PM and 7 PM, with a gym session in between (5:15 PM - 6:30 PM), then dinner (6:30 PM - 7 PM). End the day with exam prep (8 PM - 10 PM), and if you have time, wrap up any work. Sound good?`}
          </ReadMoreText>
        </SimpleChatBubbleBot>
        <CalendarEventsList
          events={events}
          isDummy={true}
          onDummyAddEvent={addToCalendar}
          disableAnimation={false}
        />
      </div>
    </AnimatedSection>
  );
}
