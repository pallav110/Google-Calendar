"use client";

import { useState } from "react";
import { colorOf } from "@/lib/colors";
import type { Occurrence } from "@/lib/recurrence";
import { addDays, isSameMonth, isToday, monthGrid, startOfDay, endOfDay, WEEKDAYS } from "@/lib/dates";
import { timeLabel } from "@/lib/time";

function eventsForDay(events: Occurrence[], day: Date): Occurrence[] {
  const lo = startOfDay(day).getTime();
  const hi = endOfDay(day).getTime();
  return events
    .filter((e) => new Date(e.start).getTime() <= hi && new Date(e.end).getTime() >= lo)
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));
}

export default function MonthView({
  cursor,
  events,
  tz,
  onCreate,
  onEdit,
  onReshape,
  onShowDay,
}: {
  cursor: Date;
  events: Occurrence[];
  tz: string;
  onCreate: (start: Date, end: Date, allDay?: boolean) => void;
  onEdit: (occ: Occurrence) => void;
  onReshape: (occ: Occurrence, startISO: string, endISO: string) => void;
  onShowDay: (day: Date) => void;
}) {
  const grid = monthGrid(cursor);
  const [dragging, setDragging] = useState<Occurrence | null>(null);

  function dropOn(day: Date) {
    if (!dragging) return;
    const oldStart = new Date(dragging.start);
    const dayDelta = Math.round(
      (startOfDay(day).getTime() - startOfDay(oldStart).getTime()) / 86400000
    );
    if (dayDelta !== 0) {
      const ns = addDays(new Date(dragging.start), dayDelta);
      const ne = addDays(new Date(dragging.end), dayDelta);
      onReshape(dragging, ns.toISOString(), ne.toISOString());
    }
    setDragging(null);
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-neutral-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6">
        {grid.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;
          const inMonth = isSameMonth(day, cursor);

          return (
            <div
              key={day.toISOString()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(day)}
              onClick={() => {
                const s = new Date(day);
                s.setHours(9, 0, 0, 0);
                onCreate(s, new Date(s.getTime() + 3600000));
              }}
              className={`group flex min-h-0 flex-col border-b border-r border-neutral-200 p-1 dark:border-neutral-800 ${
                inMonth ? "" : "bg-neutral-50/60 dark:bg-neutral-900/40"
              }`}
            >
              <div className="flex justify-center">
                <span
                  className={`my-0.5 grid h-6 w-6 place-items-center rounded-full text-xs ${
                    isToday(day)
                      ? "bg-blue-600 font-medium text-white"
                      : inMonth
                        ? "text-neutral-700 dark:text-neutral-200"
                        : "text-neutral-400"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {visible.map((occ) => {
                  const c = colorOf(occ.color);
                  return (
                    <button
                      key={occ.seriesId + occ.occurrenceStart}
                      draggable
                      onDragStart={() => setDragging(occ)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(occ);
                      }}
                      className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-xs"
                      style={
                        occ.allDay
                          ? { background: c.solid, color: "#fff" }
                          : { color: "inherit" }
                      }
                    >
                      {!occ.allDay && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.solid }} />
                      )}
                      {!occ.allDay && (
                        <span className="shrink-0 text-neutral-500">{timeLabel(occ.start, tz)}</span>
                      )}
                      <span className="truncate">{occ.title}</span>
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowDay(day);
                    }}
                    className="rounded px-1 text-left text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
