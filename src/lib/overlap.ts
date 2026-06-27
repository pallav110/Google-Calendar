// Used by the event modal (and API) to warn before saving a clashing event.

export type Interval = {
  start: string; // ISO UTC
  end: string; // ISO UTC
  allDay: boolean;
};

const ms = (s: string) => new Date(s).getTime();

/**
 * Return the events from `others` that clash with `candidate`.
 *
 * Design decisions you get to make here:
 *  1. Boundary semantics — should an event ending at 10:00 clash with one
 *     starting at 10:00? (Calendars usually say NO: back-to-back is fine.)
 *  2. All-day events — should they count as overlaps, or are they meant to
 *     coexist with timed events? (Google treats all-day as a separate lane.)
 *
 * TODO(you): implement this. A clean approach is the half-open interval test:
 *   two intervals [aStart, aEnd) and [bStart, bEnd) overlap when
 *   aStart < bEnd AND bStart < aEnd.
 * Decide how `allDay` factors in, then filter `others` down to the clashers.
 */
export function findOverlaps<T extends Interval>(candidate: Interval, others: T[]): T[] {
  // TODO(you): replace this stub.
  void candidate;
  return others.length ? [] : [];
}
