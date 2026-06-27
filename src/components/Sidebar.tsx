"use client";

import { useState } from "react";
import { addMonths, format, isSameDay, isSameMonth, isToday, monthGrid } from "@/lib/dates";

export default function Sidebar({
  cursor,
  onPickDate,
  onCreate,
  tz,
}: {
  cursor: Date;
  onPickDate: (d: Date) => void;
  onCreate: () => void;
  tz: string;
}) {
  const [miniMonth, setMiniMonth] = useState<Date>(cursor);
  const grid = monthGrid(miniMonth);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r border-neutral-200 p-4 dark:border-neutral-800 md:flex">
      <button
        onClick={onCreate}
        className="flex w-fit items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium shadow-sm transition hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
      >
        <span className="text-2xl leading-none text-blue-600">+</span> Create
      </button>

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-sm font-medium">{format(miniMonth, "MMMM yyyy")}</span>
          <div className="flex">
            <button
              onClick={() => setMiniMonth((m) => addMonths(m, -1))}
              className="grid h-7 w-7 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ‹
            </button>
            <button
              onClick={() => setMiniMonth((m) => addMonths(m, 1))}
              className="grid h-7 w-7 place-items-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] text-neutral-400">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-xs">
          {grid.map((day) => {
            const selected = isSameDay(day, cursor);
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => onPickDate(day)}
                className={`mx-auto my-0.5 grid h-7 w-7 place-items-center rounded-full transition ${
                  today
                    ? "bg-blue-600 text-white"
                    : selected
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                      : isSameMonth(day, miniMonth)
                        ? "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-auto rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900">
        <p className="font-medium text-neutral-600 dark:text-neutral-400">Timezone</p>
        <p className="truncate">{tz}</p>
      </div>
    </aside>
  );
}
