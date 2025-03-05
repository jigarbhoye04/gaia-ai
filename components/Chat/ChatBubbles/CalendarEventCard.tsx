// CalendarEventCard.tsx
import React, { useState } from "react";
import { Button } from "@heroui/button";
import {
  CalendarAdd01Icon,
  GoogleCalendar,
  Tick02Icon,
} from "../../Misc/icons"; // adjust the import path if needed
import { parsingDate } from "../../../utils/fetchDate"; // adjust the import path if needed
import { toast } from "sonner";
import { apiauth } from "@/utils/apiaxios";

interface CalendarEventCardProps {
  option: any; // ideally replace with your CalIntentOptions type
}

const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ option }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);

  const handleAddEvent = async () => {
    setLoading(true);
    try {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await apiauth.post(`/calendar/event`, {
        summary: option.summary,
        description: option.description,
        start: option.start,
        end: option.end,
        timezone: userTimeZone,
      });
      toast.success("Added event to calendar!", {
        description: option.description,
      });
      console.log(response.data);
      setAdded(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to add event to calendar!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-3 flex flex-col rounded-xl items-start gap-3">
      <div className="flex flex-row items-start gap-4">
        <GoogleCalendar height={35} width={25} />
        <div className="flex flex-col gap-1 flex-1">
          <div className="font-medium">{option.summary}</div>
          <div className="text-sm max-w-[300px]">{option.description}</div>
          <div className="text-xs text-foreground-500">
            <span className="font-medium">From: </span>
            {option.start ? parsingDate(option.start) : ""}
          </div>
          <div className="text-xs text-foreground-500">
            <span className="font-medium">To: </span>
            {option.end ? parsingDate(option.end) : ""}
          </div>
        </div>
      </div>
      <Button
        className="w-full"
        color="primary"
        isDisabled={added}
        isLoading={loading}
        onPress={handleAddEvent}
      >
        {!loading &&
          (added ? (
            <Tick02Icon color={undefined} width={22} />
          ) : (
            <CalendarAdd01Icon color={undefined} width={22} />
          ))}

        {added ? "Added Event" : "Add Event"}
      </Button>
    </div>
  );
};

export default CalendarEventCard;
