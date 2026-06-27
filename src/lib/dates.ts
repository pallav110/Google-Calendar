import {
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

export {
  addDays,
  addMonths,
  addWeeks,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  endOfDay,
  format,
} from "date-fns";

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// 6-week (42 cell) grid that frames the given month, weeks starting Sunday.
export function monthGrid(viewDate: Date): Date[] {
  const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1));
  return days;
}

// The 7 days of the week containing viewDate (Sunday first).
export function weekGrid(viewDate: Date): Date[] {
  const start = startOfWeek(viewDate, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

// Minutes from local midnight — the vertical coordinate in the day/week grid.
export function minutesIntoDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}
