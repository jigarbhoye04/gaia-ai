"use client";

import { useState } from "react";
import { Button } from "@heroui/button";

import Spinner from "@/components/ui/shadcn/spinner";
import { PlusSignIcon } from "@/components/shared/icons";
import CalendarSelector from "@/features/calendar/components/CalendarSelector";
import CalendarEventDialog from "@/features/calendar/components/CalendarEventDialog";
import { useSharedCalendar } from "@/features/calendar/hooks/useSharedCalendar";

export default function CalendarSidebar() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);

  const {
    calendars,
    selectedCalendars,
    handleCalendarSelect,
    isInitialized,
    loading,
  } = useSharedCalendar();

  if (!isInitialized || loading.calendars) {
    return (
      <div className="flex h-40 w-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex w-full justify-center">
        <Button
          color="primary"
          size="sm"
          fullWidth
          onPress={() => setIsAddDialogOpen(true)}
          className="mb-4 flex justify-start text-sm font-medium text-primary"
          variant="flat"
        >
          <PlusSignIcon color={undefined} width={18} height={18} />
          New Event
        </Button>
      </div>
      <div className="w-full px-2 pt-0 pb-1 text-xs font-medium text-foreground-400">
        Your Calendars
      </div>
      <CalendarSelector
        calendars={calendars}
        selectedCalendars={selectedCalendars}
        onCalendarSelect={handleCalendarSelect}
      />

      {isAddDialogOpen && (
        <CalendarEventDialog
          event={null}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode="create"
        />
      )}
    </div>
  );
}
