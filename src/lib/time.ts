import { formatInTimeZone } from "date-fns-tz";

// The browser's IANA timezone, e.g. "Asia/Kolkata".
export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

// All event timestamps travel as UTC ISO strings. These render them in a tz.
export function fmt(dateUtc: Date | string, pattern: string, tz: string): string {
  return formatInTimeZone(new Date(dateUtc), tz, pattern);
}

export function timeLabel(dateUtc: Date | string, tz: string): string {
  return fmt(dateUtc, "h:mm a", tz).replace(":00", "").toLowerCase();
}

export function durationMinutes(startUtc: Date | string, endUtc: Date | string): number {
  return (new Date(endUtc).getTime() - new Date(startUtc).getTime()) / 60000;
}
