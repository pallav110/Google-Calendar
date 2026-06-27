import { RRule } from "rrule";

// A DB row (masters, one-offs, and overrides all share this shape).
export type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startUtc: Date | string;
  endUtc: Date | string;
  allDay: boolean;
  color: string;
  timezone: string;
  rrule: string | null;
  recurringEventId: string | null;
  originalStartUtc: Date | string | null;
  cancelled: boolean;
};

// A concrete instance to render.
//   seriesId        -> the base/master row (or the one-off's own id)
//   overrideId      -> the row that overrides this single occurrence, if any
//   occurrenceStart -> identifies which occurrence of the series this is
export type Occurrence = {
  seriesId: string;
  overrideId: string | null;
  occurrenceStart: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  timezone: string;
  isRecurring: boolean;
};

const iso = (d: Date | string) => new Date(d).toISOString();

function build(
  fields: EventRow,
  seriesId: string,
  overrideId: string | null,
  start: Date,
  end: Date,
  occurrenceStart: Date,
  isRecurring: boolean
): Occurrence {
  return {
    seriesId,
    overrideId,
    occurrenceStart: iso(occurrenceStart),
    title: fields.title,
    description: fields.description,
    location: fields.location,
    start: iso(start),
    end: iso(end),
    allDay: fields.allDay,
    color: fields.color,
    timezone: fields.timezone,
    isRecurring,
  };
}

// Expand all rows into the concrete occurrences that fall inside [from, to].
export function expand(rows: EventRow[], from: Date, to: Date): Occurrence[] {
  const bases = rows.filter((r) => !r.recurringEventId);
  const overrides = rows.filter((r) => r.recurringEventId);

  const overrideMap = new Map<string, EventRow>();
  for (const o of overrides) {
    if (o.originalStartUtc) overrideMap.set(`${o.recurringEventId}|${iso(o.originalStartUtc)}`, o);
  }

  const out: Occurrence[] = [];
  const consumed = new Set<string>();

  for (const base of bases) {
    const baseStart = new Date(base.startUtc);
    const duration = new Date(base.endUtc).getTime() - baseStart.getTime();

    if (!base.rrule) {
      if (baseStart < to && new Date(base.endUtc) > from) {
        out.push(build(base, base.id, null, baseStart, new Date(base.endUtc), baseStart, false));
      }
      continue;
    }

    const options = RRule.parseString(base.rrule);
    options.dtstart = baseStart;
    const rule = new RRule(options);
    const searchFrom = new Date(from.getTime() - duration);
    for (const occStart of rule.between(searchFrom, to, true)) {
      const key = `${base.id}|${iso(occStart)}`;
      const override = overrideMap.get(key);
      if (override) {
        consumed.add(key);
        if (override.cancelled) continue;
        out.push(
          build(override, base.id, override.id, new Date(override.startUtc), new Date(override.endUtc), occStart, true)
        );
      } else {
        const occEnd = new Date(occStart.getTime() + duration);
        out.push(build(base, base.id, null, occStart, occEnd, occStart, true));
      }
    }
  }

  // Overrides moved into the window from an original slot outside it.
  for (const o of overrides) {
    if (o.cancelled || !o.originalStartUtc) continue;
    const key = `${o.recurringEventId}|${iso(o.originalStartUtc)}`;
    if (consumed.has(key)) continue;
    if (new Date(o.startUtc) < to && new Date(o.endUtc) > from) {
      out.push(
        build(o, o.recurringEventId!, o.id, new Date(o.startUtc), new Date(o.endUtc), new Date(o.originalStartUtc), true)
      );
    }
  }

  return out.sort((a, b) => a.start.localeCompare(b.start));
}
