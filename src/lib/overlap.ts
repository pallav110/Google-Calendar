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
 * Implementation: half-open interval test, with all-day events kept in their own
 * lane (they never clash with timed events, matching Google Calendar).
 */
export function findOverlaps<T extends Interval>(candidate: Interval, others: T[]): T[] {
  return others.filter(
    (o) =>
      o.allDay === candidate.allDay &&
      ms(candidate.start) < ms(o.end) &&
      ms(o.start) < ms(candidate.end)
  );
}
