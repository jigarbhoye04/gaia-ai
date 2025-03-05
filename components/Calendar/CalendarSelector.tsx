import { GoogleCalendar } from "@/types/calendarTypes";
import { isTooDark } from "@/utils/calendarUtils";

import { Chip, useCheckbox, VisuallyHidden } from "@heroui/react";
import { Eye, EyeOffIcon, X, XIcon } from "lucide-react";
import { useState } from "react";

interface CalendarChipProps {
  calendar: GoogleCalendar;
  selected: boolean;
  onSelect: (id: string) => void;
}

function CalendarChip({ calendar, selected, onSelect }: CalendarChipProps) {
  const baseColor = calendar.backgroundColor;
  const computedColor = isTooDark(baseColor) ? "#ffffff" : baseColor;
  // const contrastingTextColor = getContrastingColor(computedColor);

  const { getBaseProps, getLabelProps, getInputProps } = useCheckbox({
    defaultSelected: selected,
  });

  return (
    <div
      className="rounded-lg relative cursor-pointer min-w-full"
      onClick={() => onSelect(calendar.id)}
    >
      <label {...getBaseProps()} className="relative z-10 min-w-full">
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <Chip
          className="text-center items-center "
          variant="faded"
          {...(getLabelProps() as any)}
          startContent={
            selected ? (
              <Eye className="mr-1" />
            ) : (
              <EyeOffIcon className="mr-1" />
            )
          }
          style={{
            maxWidth: "100%",
            minWidth: "100%",
            backgroundColor: selected ? `${computedColor}30` : undefined,
            margin: "0",
            borderWidth: "0px",
            color: computedColor,
            borderRadius: "7px",
          }}
        >
          <div className="text-sm">{calendar.summary}</div>
        </Chip>
      </label>
    </div>
  );
}

interface CalendarSelectorProps {
  calendars: GoogleCalendar[];
  selectedCalendars: string[];
  onCalendarSelect: (calendarId: string) => void;
}

import { Filter } from "lucide-react";

import { Button } from "../ui/button";
import useMediaQuery from "@/hooks/mediaQuery";

export default function CalendarSelector({
  calendars,
  selectedCalendars,
  onCalendarSelect,
}: CalendarSelectorProps) {
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const [isOpen, setIsOpen] = useState(!isMobileScreen);

  return (
    <>
      {/* Filters Button (Opens the calendar selector) */}
      <Button
        className="fixed bottom-2 right-2 bg-primary size-[50px] shadow-md flex items-center gap-2 hover:bg-primary sm:hover:bg-[#0075a1] transition-all z-40 rounded-full text-black"
        size={"icon"}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <XIcon height={27} width={27} />
        ) : (
          <Filter height={27} width={27} />
        )}
      </Button>

      <div
        className={`flex flex-col fixed bottom-4 right-4 px-3 min-w-[250px] py-3 gap-1 justify-center pb-4 bg-zinc-800 rounded-xl max-h-[70vh] flex-nowrap overflow-y-scroll z-30 shadow-lg transition-all ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "!opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Your Calendars</span>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {calendars && calendars.length > 0 ? (
          calendars
            .sort((a, b) => a.summary.localeCompare(b.summary))
            .map((calendar) => (
              <CalendarChip
                key={calendar.id}
                calendar={calendar}
                selected={selectedCalendars.includes(calendar.id)}
                onSelect={onCalendarSelect}
              />
            ))
        ) : (
          <div className="text-sm text-foreground-500">
            You have no Calendars
          </div>
        )}
      </div>
    </>
  );
}
