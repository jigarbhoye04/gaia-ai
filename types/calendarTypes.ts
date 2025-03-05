export interface CalendarCardProps {
  event: GoogleCalendarEvent;
  onClick: () => void;
  calendars: GoogleCalendar[];
}

export interface GoogleCalendarDateTime {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}

export interface CalendarChipProps {
  calendar: GoogleCalendar;
  selected: boolean;
  onSelect: (id: string) => void;
}

export interface CalendarSelectorProps {
  calendars: GoogleCalendar[];
  selectedCalendars: string[];
  onCalendarSelect: (calendarId: string) => void;
}

export interface CalendarEventDialogProps {
  event?: GoogleCalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "view" | "create";
}

export interface GoogleCalendarPerson {
  email: string;
  self?: boolean;
}

export interface BirthdayProperties {
  contact: string;
  type: "birthday";
}

export interface GoogleCalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string;
  creator: GoogleCalendarPerson;
  organizer: GoogleCalendarPerson;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  recurrence?: string[];
  transparency?: "opaque" | "transparent";
  visibility?: "default" | "public" | "private";
  iCalUID: string;
  sequence: number;
  reminders?: {
    useDefault: boolean;
  };
  birthdayProperties?: BirthdayProperties;
  eventType?:
    | "default"
    | "birthday"
    | "outOfOffice"
    | "reminder"
    | "appointment"
    | "meeting"
    | "task"
    | "holiday"
    | "work"
    | "travel"
    | "sports"
    | "concert"
    | "party"
    | "health"
    | "study"
    | "wedding";
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  primary: boolean;
}
