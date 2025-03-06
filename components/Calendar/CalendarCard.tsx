import { Clock } from "lucide-react";
import Twemoji from "react-twemoji";
import { CalendarCardProps, GoogleCalendarEvent } from "@/types/calendarTypes";
import {
  formatEventDate,
  getEventColor,
  getEventIcon,
  isTooDark,
} from "@/utils/calendarUtils";

const CalendarCard = ({ event, onClick, calendars }: CalendarCardProps) => {
  const calendar = calendars?.find((cal) => cal.id === event?.organizer?.email);
  const color =
    calendar?.backgroundColor ||
    getEventColor(event as GoogleCalendarEvent) ||
    "#00bbff";
  const backgroundColor = isTooDark(color) ? "#ffffff" : color;
  const icon = getEventIcon(event as GoogleCalendarEvent);

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
      <div
        className="text-sm mt-2 relative z-[1] flex items-center gap-1"
        style={{ color: backgroundColor }}
      >
        {formatEventDate(event as GoogleCalendarEvent) ? (
          <>
            <Clock height={17} width={17} />
            {formatEventDate(event as GoogleCalendarEvent)}
          </>
        ) : (
          event?.time
        )}
      </div>
      <div
        className="absolute inset-0 z-[0] opacity-20 rounded-lg w-full"
        style={{ backgroundColor }}
      />
    </div>
  );
};

export default CalendarCard;
