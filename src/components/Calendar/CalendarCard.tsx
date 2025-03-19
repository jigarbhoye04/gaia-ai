import { Clock } from "lucide-react";
import { useState } from "react";
import Twemoji from "react-twemoji";

import { CalendarCardProps, GoogleCalendarEvent } from "@/types/calendarTypes";
import {
  formatEventDate,
  getEventColor,
  getEventIcon,
  isTooDark,
} from "@/utils/calendarUtils";

const CalendarCard: React.FC<CalendarCardProps> = ({
  event,
  onClick,
  calendars,
}) => {
  // Add error state for failed calendar color loading
  const [colorLoadError, setColorLoadError] = useState(false);

  // Find the calendar that matches the event organizer's email.
  const calendar = calendars?.find((cal) => cal.id === event?.organizer?.email);

  // Determine the event color with fallback handling
  const color = colorLoadError
    ? "#00bbff"
    : calendar?.backgroundColor ||
      getEventColor(event as GoogleCalendarEvent) ||
      "#00bbff";

  const backgroundColor = isTooDark(color) ? "#ffffff" : color;
  const icon = getEventIcon(event as GoogleCalendarEvent);

  // Use formatEventDate if available; otherwise, fall back to simple extraction.
  let dateDisplay: string = "";
  try {
    if ("start" in event && typeof event.start !== "string") {
      // For GoogleCalendarEvent, try formatting the date range.
      dateDisplay = formatEventDate(event as GoogleCalendarEvent) || "";
    }
    if (!dateDisplay) {
      // For TimedEvent where start is a string.
      if ("start" in event && typeof event.start === "string") {
        dateDisplay = event.start;
      } else if ("time" in event) {
        // For SingleTimeEvent.
        dateDisplay = event.time;
      }
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    dateDisplay = "Date formatting error";
  }

  return (
    <div
      className="relative z-[1] w-full cursor-pointer overflow-hidden rounded-lg p-4 text-white shadow-md transition-colors duration-200 hover:bg-zinc-800"
      onClick={onClick}
    >
      <div
        className="absolute inset-0 z-[2] border-l-5"
        style={{ borderColor: backgroundColor }}
      />
      <div className="relative z-[1] flex items-center gap-2">
        <Twemoji options={{ className: "twemoji max-w-[20px]" }}>
          <span className="text-xl">{icon}</span>
        </Twemoji>
        <div className="flex flex-col gap-1">
          <div className="text-md line-clamp-1 font-medium">
            {event.summary}
          </div>
          {dateDisplay && (
            <div className="text-sm text-zinc-400">{dateDisplay}</div>
          )}
          {event.description && (
            <div className="line-clamp-2 text-sm text-zinc-500">
              {event.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarCard;
