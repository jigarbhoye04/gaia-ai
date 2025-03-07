import { Clock } from "lucide-react";
import Twemoji from "react-twemoji";
import {
  CalendarCardProps,
  GoogleCalendarEvent,
  CalendarEvent,
  SingleTimeEvent,
  TimedEvent,
} from "@/types/calendarTypes";
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
  // Find the calendar that matches the event organizer's email.
  const calendar = calendars?.find((cal) => cal.id === event?.organizer?.email);

  // Determine the event color.
  const color =
    calendar?.backgroundColor ||
    getEventColor(event as GoogleCalendarEvent) ||
    "#00bbff";
  const backgroundColor = isTooDark(color) ? "#ffffff" : color;
  const icon = getEventIcon(event as GoogleCalendarEvent);

  // Use formatEventDate if available; otherwise, fall back to simple extraction.
  let dateDisplay: string = "";
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

  return (
    <div
      className="text-white p-4 rounded-lg shadow-md cursor-pointer w-full transition-colors duration-200 relative z-[1] overflow-hidden"
      onClick={onClick}
    >
      <div
        className="absolute inset-0 border-l-5 z-[2]"
        style={{ borderColor: backgroundColor }}
      />
      <div className="flex items-center gap-2 relative z-[1]">
        <Twemoji options={{ className: "twemoji max-w-[20px]" }}>
          <span className="text-xl">{icon}</span>
        </Twemoji>
        <div className="font-bold text-lg">{event.summary}</div>
      </div>
      {dateDisplay && (
        <div
          className="text-sm mt-2 relative z-[1] flex items-center gap-1"
          style={{ color: backgroundColor }}
        >
          <Clock height={17} width={17} />
          {dateDisplay}
        </div>
      )}
      <div
        className="absolute inset-0 z-[0] opacity-20 rounded-lg w-full"
        style={{ backgroundColor }}
      />
    </div>
  );
};

export default CalendarCard;
