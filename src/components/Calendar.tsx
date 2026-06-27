"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { listEvents, updateEvent, type EventPayload } from "@/lib/api";
import type { Occurrence } from "@/lib/recurrence";
import { localTimezone } from "@/lib/time";
import type { ModalTarget, ViewType } from "@/lib/types";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  monthGrid,
  startOfDay,
  weekGrid,
} from "@/lib/dates";
import Sidebar from "./Sidebar";
import CalendarHeader from "./CalendarHeader";
import MonthView from "./MonthView";
import TimeGridView from "./TimeGridView";
import EventModal from "./EventModal";

type User = { name: string | null; email: string | null; image: string | null };

const sameOcc = (a: Occurrence, b: Occurrence) =>
  a.seriesId === b.seriesId && a.occurrenceStart === b.occurrenceStart;

function occToPayload(occ: Occurrence, patch: Partial<EventPayload>): EventPayload {
  return {
    title: occ.title,
    description: occ.description ?? null,
    location: occ.location ?? null,
    start: occ.start,
    end: occ.end,
    allDay: occ.allDay,
    color: occ.color,
    timezone: occ.timezone,
    rrule: null,
    ...patch,
  };
}

export default function Calendar({ user }: { user: User }) {
  const tz = useMemo(() => localTimezone(), []);
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewType>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [events, setEvents] = useState<Occurrence[]>([]);
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("gcal:dark");
    const prefersDark = saved ? saved === "1" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(prefersDark);
    setSidebarOpen(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("gcal:dark", dark ? "1" : "0");
  }, [dark, mounted]);

  const range = useMemo(() => {
    if (view === "month") {
      const grid = monthGrid(cursor);
      return { from: startOfDay(grid[0]), to: endOfDay(grid[grid.length - 1]) };
    }
    if (view === "week") {
      const days = weekGrid(cursor);
      return { from: startOfDay(days[0]), to: endOfDay(days[6]) };
    }
    return { from: startOfDay(cursor), to: endOfDay(cursor) };
  }, [view, cursor]);

  const reload = useCallback(async () => {
    try {
      setEvents(await listEvents(range.from, range.to));
    } catch (e) {
      console.error("Failed to load events", e);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    if (mounted) reload();
  }, [mounted, reload]);

  // Fire a browser notification when an event's reminder time arrives (while open).
  useEffect(() => {
    if (!("Notification" in window)) return;
    const now = Date.now();
    const timers = events.flatMap((e) => {
      if (e.reminderMinutes == null) return [];
      const delay = new Date(e.start).getTime() - e.reminderMinutes * 60000 - now;
      if (delay <= 0 || delay > 86_400_000) return [];
      return [
        setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification(e.title || "Event", {
              body: `Starts ${new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
            });
          }
        }, delay),
      ];
    });
    return () => timers.forEach(clearTimeout);
  }, [events]);

  const navigate = useCallback(
    (dir: -1 | 0 | 1) => {
      if (dir === 0) return setCursor(new Date());
      setCursor((c) =>
        view === "month" ? addMonths(c, dir) : view === "week" ? addWeeks(c, dir) : addDays(c, dir)
      );
    },
    [view]
  );

  const openCreate = useCallback(
    (start: Date, end: Date, allDay = false) => {
      setModal({ mode: "create", start: start.toISOString(), end: end.toISOString(), allDay });
    },
    []
  );

  const openEdit = useCallback((occ: Occurrence) => setModal({ mode: "edit", occ }), []);

  // Drag-move / resize: optimistic local change, persist, then reconcile.
  const onReshape = useCallback(
    async (occ: Occurrence, startISO: string, endISO: string) => {
      setEvents((prev) =>
        prev.map((e) => (sameOcc(e, occ) ? { ...e, start: startISO, end: endISO } : e))
      );
      try {
        await updateEvent(
          occ.seriesId,
          occToPayload(occ, { start: startISO, end: endISO }),
          {
            scope: occ.isRecurring ? "single" : "all",
            occurrenceStart: occ.occurrenceStart,
            overrideId: occ.overrideId,
          }
        );
      } catch (e) {
        console.error("Failed to save change", e);
      } finally {
        reload();
      }
    },
    [reload]
  );

  // Keyboard shortcuts (ignored while typing or with a modal open).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (modal || el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === "m") setView("month");
      else if (k === "w") setView("week");
      else if (k === "d") setView("day");
      else if (k === "t") navigate(0);
      else if (k === "arrowright" || k === "n") navigate(1);
      else if (k === "arrowleft" || k === "p") navigate(-1);
      else if (k === "c") {
        const s = new Date();
        s.setMinutes(0, 0, 0);
        openCreate(s, new Date(s.getTime() + 3600000));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, navigate, openCreate]);

  if (!mounted) {
    return <div className="h-screen bg-white dark:bg-neutral-950" />;
  }

  return (
    <div className="flex h-screen flex-col bg-white text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
      <CalendarHeader
        view={view}
        cursor={cursor}
        user={user}
        dark={dark}
        onToggleDark={() => setDark((d) => !d)}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onView={setView}
        onNavigate={navigate}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          cursor={cursor}
          onPickDate={setCursor}
          onCreate={() => {
            const s = new Date();
            s.setMinutes(0, 0, 0);
            openCreate(s, new Date(s.getTime() + 3600000));
          }}
          tz={tz}
        />
        <main className="min-w-0 flex-1 overflow-hidden">
          {view === "month" ? (
            <MonthView
              cursor={cursor}
              events={events}
              tz={tz}
              onCreate={openCreate}
              onEdit={openEdit}
              onReshape={onReshape}
              onShowDay={(d) => {
                setCursor(d);
                setView("day");
              }}
            />
          ) : (
            <TimeGridView
              days={view === "week" ? weekGrid(cursor) : [cursor]}
              events={events}
              tz={tz}
              onCreate={openCreate}
              onEdit={openEdit}
              onReshape={onReshape}
            />
          )}
        </main>
      </div>

      <AnimatePresence>
        {modal && (
          <EventModal
            target={modal}
            tz={tz}
            existing={events}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              reload();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
