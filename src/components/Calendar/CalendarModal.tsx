"use client";

import { useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { parseISO, format } from "date-fns";

import { apiauth } from "@/utils/apiaxios";
import { RootState } from "@/redux/store";
import {
  closeModal,
  setStatus,
  updateEditedEvent,
} from "@/redux/slices/calendarModalSlice";
import { TimedEvent } from "@/types/calendarTypes";

const isTimedEvent = (event: any): event is TimedEvent =>
  "start" in event && "end" in event;

// Custom function to get date only from ISO string without timezone effects
const getDateFromISOString = (isoString: string): string => {
  // Extract just the date part using string operations to avoid timezone issues
  return isoString.split("T")[0];
};

// Custom function to get just the hours and minutes from an ISO string
// WITHOUT being affected by timezone
const getTimeFromISOString = (isoString: string): string => {
  // Extract just the time part using string operations
  const timePart = isoString.split("T")[1];
  // Get hours and minutes (first 5 characters of the time part: HH:mm)
  return timePart.substring(0, 5);
};

// Function to create an ISO string with a specific date and time
// while preserving the fixed time regardless of timezone
const createISOWithFixedTime = (dateStr: string, timeStr: string): string => {
  // Combine date and time parts into a new ISO string with Z to indicate UTC
  return `${dateStr}T${timeStr}:00Z`;
};

export default function CalendarModal() {
  const dispatch = useDispatch();
  const { isOpen, editedEvent, status, isDummyEvent, onEventSuccess } =
    useSelector((state: RootState) => state.calendarModal);

  const handleClose = () => dispatch(closeModal());

  const handleEditSubmit = useCallback(async () => {
    if (!editedEvent) return;

    dispatch(setStatus("loading"));
    if (isDummyEvent) {
      setTimeout(() => {
        toast.success("Event updated and added!", {
          description: editedEvent.description,
        });
        onEventSuccess?.();
        handleClose();
      }, 300);
      return;
    }

    if (!isTimedEvent(editedEvent)) {
      toast.error("Real events require start and end times.");
      return;
    }

    try {
      // Don't include timezone in the request, since we're using fixed times
      await apiauth.post("/calendar/event", {
        ...editedEvent,
        // Set fixed timezone flag to indicate this event should display at the exact time specified
        fixedTime: true,
      });
      toast.success("Event updated and added to calendar!", {
        description: editedEvent.description,
      });
      onEventSuccess?.();
      handleClose();
    } catch (error) {
      toast.error("Failed to add event!");
      console.error(error);
    } finally {
      dispatch(setStatus("idle"));
    }
  }, [editedEvent, isDummyEvent, onEventSuccess, dispatch]);

  const handleInputChange = (field: keyof TimedEvent, value: string) => {
    if (!editedEvent) return;
    dispatch(updateEditedEvent({ ...editedEvent, [field]: value }));
  };

  const handleDateTimeChange = (
    type: "start" | "end",
    value: string,
    isTime: boolean,
  ) => {
    if (!editedEvent || !isTimedEvent(editedEvent)) return;

    // Get the current date and time strings without timezone conversion
    const currentDateStr = getDateFromISOString(
      type === "start" ? editedEvent.start : editedEvent.end,
    );
    const currentTimeStr = getTimeFromISOString(
      type === "start" ? editedEvent.start : editedEvent.end,
    );

    // Update either the date or time part
    let newDateStr = currentDateStr;
    let newTimeStr = currentTimeStr;

    if (isTime) {
      newTimeStr = value;
    } else {
      newDateStr = value;
    }

    // Create a new ISO string with the updated parts
    const newISOString = createISOWithFixedTime(newDateStr, newTimeStr);

    dispatch(
      updateEditedEvent({
        ...editedEvent,
        [type]: newISOString,
      }),
    );
  };

  if (!editedEvent) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Edit Event Details</ModalHeader>
        <ModalBody>
          <Input
            labelPlacement="outside"
            label="Summary"
            value={editedEvent.summary}
            onChange={(e) => handleInputChange("summary", e.target.value)}
          />
          <Input
            labelPlacement="outside"
            label="Description"
            value={editedEvent.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
          {isTimedEvent(editedEvent) && (
            <>
              <div className="flex w-full justify-evenly gap-2">
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="startDate" className="text-sm">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    className="cursor-pointer rounded-xl bg-zinc-800 p-2 transition hover:bg-zinc-700"
                    value={getDateFromISOString(editedEvent.start)}
                    onChange={(e) =>
                      handleDateTimeChange("start", e.target.value, false)
                    }
                  />
                </div>
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="startTime" className="text-sm">
                    Start Time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    required
                    className="cursor-pointer rounded-xl bg-zinc-800 p-2 transition hover:bg-zinc-700"
                    value={getTimeFromISOString(editedEvent.start)}
                    onChange={(e) =>
                      handleDateTimeChange("start", e.target.value, true)
                    }
                  />
                </div>
              </div>
              <div className="flex w-full justify-evenly gap-2">
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="endDate" className="text-sm">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    required
                    className="cursor-pointer rounded-xl bg-zinc-800 p-2 transition hover:bg-zinc-700"
                    value={getDateFromISOString(editedEvent.end)}
                    onChange={(e) =>
                      handleDateTimeChange("end", e.target.value, false)
                    }
                  />
                </div>
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="endTime" className="text-sm">
                    End Time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    required
                    className="cursor-pointer rounded-xl bg-zinc-800 p-2 transition hover:bg-zinc-700"
                    value={getTimeFromISOString(editedEvent.end)}
                    onChange={(e) =>
                      handleDateTimeChange("end", e.target.value, true)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            onPress={handleEditSubmit}
            isLoading={status === "loading"}
            color="primary"
          >
            Save & Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
