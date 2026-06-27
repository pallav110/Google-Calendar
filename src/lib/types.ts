import type { Occurrence } from "./recurrence";

export type ViewType = "month" | "week" | "day";

// What the event modal is currently working on.
export type ModalTarget =
  | { mode: "create"; start: string; end: string; allDay: boolean }
  | { mode: "edit"; occ: Occurrence };

// Pixels per hour in the day/week time grid.
export const HOUR_PX = 48;
export const DAY_PX = HOUR_PX * 24;

// Snap drag/resize to this many minutes.
export const SNAP_MIN = 15;
