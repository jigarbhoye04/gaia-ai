import { GoogleCalendarEvent } from "@/types/features/calendarTypes";

export interface CalendarEventsResponse {
  events: GoogleCalendarEvent[];
  nextPageToken: string | null;
}

export interface Calendar {
  id: string;
  name: string;
  summary: string;
  primary?: boolean;
  selected?: boolean;
  backgroundColor?: string;
}
