const nth = (date: number): string => {
  if (date > 3 && date < 21) return "th";
  switch (date % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export default function fetchDate(): string {
  return new Date().toISOString();
}

export const parsingDate = (isoString: string) => {
  const withoutTimezone = isoString.replace(/([+-]\d{2}:\d{2})$/, "");
  const date = new Date(withoutTimezone);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

export function parseDate(isoDateString: string): string {
  const date = new Date(isoDateString);
  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const optionsMonth: Intl.DateTimeFormatOptions = { month: "short" };
  const optionsYear: Intl.DateTimeFormatOptions = { year: "2-digit" };

  const time = date
    .toLocaleString(navigator.language, optionsTime)
    .toUpperCase();
  const month = date.toLocaleString(navigator.language, optionsMonth);
  const year = date.toLocaleString(navigator.language, optionsYear);
  const day = date.getDate();

  return `${time} ${day}${nth(day)} ${month} '${year}`.trim();
}

export function parseDate2(isoDateString: string): string {
  const date = new Date(isoDateString);
  const optionsMonth: Intl.DateTimeFormatOptions = { month: "short" };
  const month = date.toLocaleString(navigator.language, optionsMonth);
  const day = date.getDate();

  return `${day}${nth(day)} ${month}`.trim();
}
