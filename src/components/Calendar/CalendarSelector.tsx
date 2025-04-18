import { Chip, useCheckbox, VisuallyHidden } from "@heroui/react";
import { Eye, EyeOffIcon, Filter, X, XIcon } from "lucide-react";
import { useState } from "react";

import useMediaQuery from "@/hooks/useMediaQuery";
import {
  CalendarChipProps,
  CalendarSelectorProps,
} from "@/types/calendarTypes";
import { isTooDark } from "@/utils/calendarUtils";

import { Button } from "../ui/button";

function CalendarChip({ calendar, selected, onSelect }: CalendarChipProps) {
  const baseColor = calendar.backgroundColor;
  const computedColor = isTooDark(baseColor) ? "#ffffff" : baseColor;
  // const contrastingTextColor = getContrastingColor(computedColor);

  const { getBaseProps, getLabelProps, getInputProps } = useCheckbox({
    defaultSelected: selected,
  });

  return (
    <div
      className="relative min-w-full cursor-pointer rounded-lg"
      onClick={() => onSelect(calendar.id)}
    >
      <label {...getBaseProps()} className="relative z-10 min-w-full">
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <Chip
          className="items-center text-center"
          variant="faded"
          {...getLabelProps()}
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
        className="fixed right-2 bottom-2 z-40 flex size-[50px] items-center gap-2 rounded-full bg-primary text-black shadow-md transition-all hover:bg-primary sm:hover:bg-[#0075a1]"
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
        className={`fixed right-8 bottom-4 z-30 flex max-h-[70vh] min-w-[250px] flex-col flex-nowrap justify-center gap-1 overflow-y-auto rounded-xl bg-zinc-800 px-3 py-3 pb-4 shadow-lg transition-all ${
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0!"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
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
