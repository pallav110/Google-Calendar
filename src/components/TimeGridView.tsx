"use client";

import { useEffect, useRef, useState } from "react";
import { colorOf } from "@/lib/colors";
import { packColumns } from "@/lib/layout";
import type { Occurrence } from "@/lib/recurrence";
import { DAY_PX, HOUR_PX, SNAP_MIN } from "@/lib/types";
import { HOURS, isToday, startOfDay, endOfDay } from "@/lib/dates";
import { timeLabel } from "@/lib/time";

type Gesture =
  | { kind: "create"; dayIndex: number; anchorMin: number; curMin: number; moved: boolean }
  | { kind: "move"; occ: Occurrence; dayIndex: number; topMin: number; durMin: number; grabMin: number; moved: boolean }
  | { kind: "resize"; occ: Occurrence; edge: "top" | "bottom"; dayIndex: number; topMin: number; botMin: number; moved: boolean };

const hourLabel = (h: number) =>
  h === 0 ? "" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

const minsToISO = (day: Date, mins: number) => {
  const d = startOfDay(day);
  d.setMinutes(mins);
  return d.toISOString();
};

export default function TimeGridView({
  days,
  events,
  tz,
  onCreate,
  onEdit,
  onReshape,
}: {
  days: Date[];
  events: Occurrence[];
  tz: string;
  onCreate: (start: Date, end: Date, allDay?: boolean) => void;
  onEdit: (occ: Occurrence) => void;
  onReshape: (occ: Occurrence, startISO: string, endISO: string) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  function snap(m: number) {
    return Math.max(0, Math.min(1440, Math.round(m / SNAP_MIN) * SNAP_MIN));
  }
  function minutesAt(clientY: number) {
    const r = bodyRef.current!.getBoundingClientRect();
    return snap(((clientY - r.top) / r.height) * 1440);
  }
  function dayIndexAt(clientX: number) {
    const r = bodyRef.current!.getBoundingClientRect();
    const i = Math.floor((clientX - r.left) / (r.width / days.length));
    return Math.max(0, Math.min(days.length - 1, i));
  }

  function commit(g: Gesture) {
    if (g.kind === "create") {
      const day = days[g.dayIndex];
      if (!g.moved) {
        const s = minsToISO(day, g.anchorMin);
        onCreate(new Date(s), new Date(minsToISO(day, g.anchorMin + 60)));
      } else {
        const lo = Math.min(g.anchorMin, g.curMin);
        const hi = Math.max(g.anchorMin, g.curMin);
        onCreate(new Date(minsToISO(day, lo)), new Date(minsToISO(day, Math.max(hi, lo + SNAP_MIN))));
      }
    } else if (g.kind === "move") {
      if (!g.moved) return onEdit(g.occ);
      const day = days[g.dayIndex];
      const top = Math.max(0, Math.min(1440 - g.durMin, g.topMin));
      onReshape(g.occ, minsToISO(day, top), minsToISO(day, top + g.durMin));
    } else {
      if (!g.moved) return onEdit(g.occ);
      const day = days[g.dayIndex];
      onReshape(g.occ, minsToISO(day, g.topMin), minsToISO(day, g.botMin));
    }
  }

  // Drive the active gesture from window-level pointer events.
  useEffect(() => {
    if (!gesture) return;
    function onMove(e: PointerEvent) {
      const min = minutesAt(e.clientY);
      const dayIndex = dayIndexAt(e.clientX);
      setGesture((g) => {
        if (!g) return g;
        if (g.kind === "create") return { ...g, curMin: min, moved: true };
        if (g.kind === "move") return { ...g, dayIndex, topMin: min - g.grabMin, moved: true };
        return g.edge === "top"
          ? { ...g, topMin: Math.min(min, g.botMin - SNAP_MIN), moved: true }
          : { ...g, botMin: Math.max(min, g.topMin + SNAP_MIN), moved: true };
      });
    }
    function onUp() {
      setGesture((g) => {
        if (!g) return null;
        commit(g);
        return null;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture]);

  function timedForDay(day: Date) {
    const lo = startOfDay(day).getTime();
    const hi = endOfDay(day).getTime();
    const list = events.filter(
      (e) => !e.allDay && new Date(e.start).getTime() < hi && new Date(e.end).getTime() > lo
    );
    return packColumns(list).map(({ item, left, width }) => {
      const s = Math.max(new Date(item.start).getTime(), lo);
      const en = Math.min(new Date(item.end).getTime(), hi + 1);
      const topMin = (s - lo) / 60000;
      const durMin = Math.max((en - s) / 60000, SNAP_MIN);
      return { occ: item, topMin, durMin, left, width };
    });
  }

  function allDayForDay(day: Date) {
    const lo = startOfDay(day).getTime();
    const hi = endOfDay(day).getTime();
    return events.filter(
      (e) => e.allDay && new Date(e.start).getTime() <= hi && new Date(e.end).getTime() >= lo
    );
  }

  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-30 bg-white dark:bg-neutral-950">
        {/* Day headers */}
        <div className="grid border-b border-neutral-200 dark:border-neutral-800" style={cols(days.length)}>
          <div className="w-16" />
        {days.map((day) => (
          <div key={day.toISOString()} className="py-2 text-center">
            <div className="text-xs uppercase text-neutral-500">
              {day.toLocaleDateString(undefined, { weekday: "short" })}
            </div>
            <div
              className={`mx-auto mt-1 grid h-9 w-9 place-items-center rounded-full text-xl ${
                isToday(day) ? "bg-blue-600 font-medium text-white" : ""
              }`}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      <div className="grid border-b border-neutral-200 dark:border-neutral-800" style={cols(days.length)}>
        <div className="flex w-16 items-center justify-end pr-2 text-[11px] text-neutral-400">all-day</div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            onClick={() => {
              const s = startOfDay(day);
              onCreate(s, endOfDay(day), true);
            }}
            className="min-h-7 space-y-0.5 border-l border-neutral-200 p-0.5 dark:border-neutral-800"
          >
            {allDayForDay(day).map((occ) => {
              const c = colorOf(occ.color);
              return (
                <button
                  key={occ.seriesId + occ.occurrenceStart}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(occ);
                  }}
                  className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium text-white"
                  style={{ background: c.solid }}
                >
                  {occ.title}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: DAY_PX }}>
          <div className="relative w-16 shrink-0">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-neutral-400"
                style={{ top: h * HOUR_PX }}
              >
                {hourLabel(h)}
              </div>
            ))}
          </div>

          <div ref={bodyRef} className="relative grid flex-1" style={cols(days.length, true)}>
            {/* Hour lines */}
            {HOURS.map((h) => (
              <div
                key={h}
                className="pointer-events-none absolute left-0 right-0 border-t border-neutral-100 dark:border-neutral-800"
                style={{ top: h * HOUR_PX, gridColumn: "1 / -1" }}
              />
            ))}

            {days.map((day, dayIndex) => (
              <div
                key={day.toISOString()}
                className="relative border-l border-neutral-200 dark:border-neutral-800"
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  setGesture({
                    kind: "create",
                    dayIndex,
                    anchorMin: minutesAt(e.clientY),
                    curMin: minutesAt(e.clientY),
                    moved: false,
                  });
                }}
              >
                {isToday(day) && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                    style={{ top: (nowMin / 1440) * DAY_PX }}
                  >
                    <div className="h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-500" />
                    <div className="h-px flex-1 bg-red-500" />
                  </div>
                )}

                {timedForDay(day).map(({ occ, topMin, durMin, left, width }) => (
                  <EventBlock
                    key={occ.seriesId + occ.occurrenceStart}
                    occ={occ}
                    tz={tz}
                    top={(topMin / 1440) * DAY_PX}
                    height={(durMin / 1440) * DAY_PX}
                    left={left}
                    width={width}
                    onStartMove={(grabMin) =>
                      setGesture({ kind: "move", occ, dayIndex, topMin, durMin, grabMin, moved: false })
                    }
                    onStartResize={(edge) =>
                      setGesture({
                        kind: "resize",
                        occ,
                        edge,
                        dayIndex,
                        topMin,
                        botMin: topMin + durMin,
                        moved: false,
                      })
                    }
                    minutesAt={minutesAt}
                  />
                ))}

                {/* Ghost preview while creating */}
                {gesture?.kind === "create" && gesture.dayIndex === dayIndex && gesture.moved && (
                  <Ghost
                    top={(Math.min(gesture.anchorMin, gesture.curMin) / 1440) * DAY_PX}
                    height={(Math.abs(gesture.curMin - gesture.anchorMin) / 1440) * DAY_PX}
                  />
                )}
                {gesture?.kind === "move" && gesture.dayIndex === dayIndex && gesture.moved && (
                  <Ghost top={(gesture.topMin / 1440) * DAY_PX} height={(gesture.durMin / 1440) * DAY_PX} />
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

function cols(n: number, body = false): React.CSSProperties {
  return { gridTemplateColumns: body ? `repeat(${n}, 1fr)` : `4rem repeat(${n}, 1fr)` };
}

function EventBlock({
  occ,
  tz,
  top,
  height,
  left,
  width,
  onStartMove,
  onStartResize,
  minutesAt,
}: {
  occ: Occurrence;
  tz: string;
  top: number;
  height: number;
  left: number;
  width: number;
  onStartMove: (grabMin: number) => void;
  onStartResize: (edge: "top" | "bottom") => void;
  minutesAt: (clientY: number) => number;
}) {
  const c = colorOf(occ.color);
  return (
    <div
      className="absolute z-10 overflow-hidden rounded-md px-1.5 py-0.5 text-xs shadow-sm"
      style={{
        top,
        height: Math.max(height, 16),
        left: `calc(${left * 100}% + 2px)`,
        width: `calc(${width * 100}% - 4px)`,
        background: c.soft,
        color: c.text,
        borderLeft: `3px solid ${c.solid}`,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        const topMin = (top / DAY_PX) * 1440;
        onStartMove(minutesAt(e.clientY) - topMin);
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResize("top");
        }}
      />
      <div className="pointer-events-none flex items-center gap-1 font-medium leading-tight">
        <span className="truncate">{occ.title || "(No title)"}</span>
        {occ.reminderMinutes != null && <span className="shrink-0">🔔</span>}
        {occ.guests && <span className="shrink-0">👥</span>}
      </div>
      {height > 28 && <div className="pointer-events-none opacity-70">{timeLabel(occ.start, tz)}</div>}
      <div
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartResize("bottom");
        }}
      />
    </div>
  );
}

function Ghost({ top, height }: { top: number; height: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-1 z-30 rounded-md border-2 border-blue-400 bg-blue-200/40"
      style={{ top, height: Math.max(height, 12) }}
    />
  );
}
