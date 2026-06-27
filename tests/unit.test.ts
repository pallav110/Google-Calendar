// Independent unit tests for the core calendar logic — run with: npm test
import { expand, type EventRow } from "../src/lib/recurrence";
import { findOverlaps } from "../src/lib/overlap";
import { packColumns } from "../src/lib/layout";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${name}`);
  }
}

const base = (over: Partial<EventRow> = {}): EventRow => ({
  id: "evt1",
  title: "Standup",
  description: null,
  location: null,
  startUtc: "2026-06-01T10:00:00Z",
  endUtc: "2026-06-01T10:30:00Z",
  allDay: false,
  color: "blue",
  timezone: "UTC",
  rrule: null,
  recurringEventId: null,
  originalStartUtc: null,
  cancelled: false,
  ...over,
});

const FROM = new Date("2026-06-01T00:00:00Z");
const TO = new Date("2026-06-30T23:59:59Z");

console.log("\n── Recurrence expansion ──");
{
  const occ = expand([base({ rrule: "FREQ=WEEKLY" })], FROM, TO);
  check("weekly event yields 5 June occurrences (1,8,15,22,29)", occ.length === 5);
  check("all occurrences flagged isRecurring", occ.every((o) => o.isRecurring));
  check("occurrenceStart is unique per instance", new Set(occ.map((o) => o.occurrenceStart)).size === 5);
}
{
  const rows: EventRow[] = [
    base({ rrule: "FREQ=WEEKLY" }),
    base({
      id: "ovr1",
      recurringEventId: "evt1",
      originalStartUtc: "2026-06-08T10:00:00Z",
      startUtc: "2026-06-08T14:00:00Z",
      endUtc: "2026-06-08T15:00:00Z",
    }),
  ];
  const occ = expand(rows, FROM, TO);
  const moved = occ.find((o) => o.occurrenceStart === "2026-06-08T10:00:00.000Z");
  check("override keeps total count at 5", occ.length === 5);
  check("overridden Jun-8 instance moved to 14:00", new Date(moved!.start).getUTCHours() === 14);
  check("override carries its override row id", Boolean(moved!.overrideId));
}
{
  const rows: EventRow[] = [
    base({ rrule: "FREQ=WEEKLY" }),
    base({ id: "ovr2", recurringEventId: "evt1", originalStartUtc: "2026-06-15T10:00:00Z", cancelled: true }),
  ];
  const occ = expand(rows, FROM, TO);
  check("cancelled occurrence removed (5 -> 4)", occ.length === 4);
  check("Jun-15 instance is gone", !occ.some((o) => o.occurrenceStart === "2026-06-15T10:00:00.000Z"));
}
{
  const occ = expand([base()], FROM, TO);
  check("one-off event appears exactly once", occ.length === 1 && !occ[0].isRecurring);
}
{
  const occ = expand([base({ startUtc: "2026-07-15T10:00:00Z", endUtc: "2026-07-15T11:00:00Z" })], FROM, TO);
  check("event outside window is excluded", occ.length === 0);
}

console.log("\n── Overlap detection ──");
{
  const cand = { start: "2026-06-01T10:00:00Z", end: "2026-06-01T11:00:00Z", allDay: false };
  const other = [{ start: "2026-06-01T10:30:00Z", end: "2026-06-01T11:30:00Z", allDay: false, id: "x" }];
  check("genuine overlap detected", findOverlaps(cand, other).length === 1);
}
{
  const cand = { start: "2026-06-01T10:00:00Z", end: "2026-06-01T11:00:00Z", allDay: false };
  const other = [{ start: "2026-06-01T11:00:00Z", end: "2026-06-01T12:00:00Z", allDay: false, id: "x" }];
  check("back-to-back events do NOT clash (half-open)", findOverlaps(cand, other).length === 0);
}
{
  const cand = { start: "2026-06-01T10:00:00Z", end: "2026-06-01T11:00:00Z", allDay: true };
  const other = [{ start: "2026-06-01T10:30:00Z", end: "2026-06-01T11:30:00Z", allDay: false, id: "x" }];
  check("all-day and timed kept in separate lanes", findOverlaps(cand, other).length === 0);
}

console.log("\n── Column packing ──");
{
  const items = [
    { start: "2026-06-01T10:00:00Z", end: "2026-06-01T11:00:00Z" },
    { start: "2026-06-01T10:30:00Z", end: "2026-06-01T11:30:00Z" },
  ];
  const packed = packColumns(items);
  check("two overlapping events split into half-width columns", packed.every((p) => p.width === 0.5));
}
{
  const items = [
    { start: "2026-06-01T10:00:00Z", end: "2026-06-01T11:00:00Z" },
    { start: "2026-06-01T12:00:00Z", end: "2026-06-01T13:00:00Z" },
  ];
  const packed = packColumns(items);
  check("two sequential events each take full width", packed.every((p) => p.width === 1));
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
