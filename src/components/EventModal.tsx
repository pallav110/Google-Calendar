"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { COLOR_KEYS, colorOf } from "@/lib/colors";
import { createEvent, deleteEvent, updateEvent, type EditScope, type EventPayload } from "@/lib/api";
import { findOverlaps } from "@/lib/overlap";
import type { Occurrence } from "@/lib/recurrence";
import type { ModalTarget } from "@/lib/types";
import { startOfDay, endOfDay } from "@/lib/dates";
import { clearDraft, loadDraft, saveDraft } from "@/lib/drafts";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toLocalDate = (iso: string) => toLocalInput(iso).slice(0, 10);

const FREQS = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const REMINDERS: { value: number | ""; label: string }[] = [
  { value: "", label: "No notification" },
  { value: 0, label: "At time of event" },
  { value: 10, label: "10 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
];

export default function EventModal({
  target,
  tz,
  existing,
  onClose,
  onSaved,
}: {
  target: ModalTarget;
  tz: string;
  existing: Occurrence[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = target.mode === "edit";
  const src = editing ? target.occ : null;
  const draft = !editing ? loadDraft() : null;

  const [title, setTitle] = useState(src?.title ?? draft?.title ?? "");
  const [location, setLocation] = useState(src?.location ?? draft?.location ?? "");
  const [description, setDescription] = useState(src?.description ?? draft?.description ?? "");
  const [color, setColor] = useState(src?.color ?? draft?.color ?? "blue");
  const initialAllDay = target.mode === "edit" ? target.occ.allDay : (draft?.allDay ?? target.allDay);
  const [allDay, setAllDay] = useState(initialAllDay);

  const initStart = editing ? src!.start : target.start;
  const initEnd = editing ? src!.end : target.end;
  const [startTime, setStartTime] = useState(draft?.start ?? toLocalInput(initStart));
  const [endTime, setEndTime] = useState(draft?.end ?? toLocalInput(initEnd));
  const [startDate, setStartDate] = useState(toLocalDate(initStart));
  const [endDate, setEndDate] = useState(toLocalDate(initEnd));

  const [freq, setFreq] = useState(draft?.freq ?? (src?.isRecurring ? deriveFreq(src) : "none"));
  const initGuests = src?.guests ?? draft?.guests ?? "";
  const [guestList, setGuestList] = useState<string[]>(initGuests ? initGuests.split(",").filter(Boolean) : []);
  const [guestInput, setGuestInput] = useState("");
  const [reminder, setReminder] = useState<number | "">(src?.reminderMinutes ?? draft?.reminder ?? "");
  const [visibility, setVisibility] = useState(src?.visibility ?? draft?.visibility ?? "default");
  const [busy, setBusy] = useState<boolean>(src?.busy ?? draft?.busy ?? true);
  const [scope, setScope] = useState<EditScope>("single");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addGuest() {
    const v = guestInput.trim().replace(/,$/, "");
    if (v && !guestList.includes(v)) setGuestList([...guestList, v]);
    setGuestInput("");
  }
  function onReminder(value: string) {
    const v = value === "" ? "" : Number(value);
    setReminder(v);
    if (v !== "" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  // Persist the in-progress NEW event so a reload / offline drop doesn't lose it.
  useEffect(() => {
    if (editing) return;
    saveDraft({
      title, description, location, start: startTime, end: endTime, allDay, color, freq,
      guests: guestList.join(","), reminder: reminder === "" ? null : reminder, visibility, busy,
    });
  }, [editing, title, description, location, startTime, endTime, allDay, color, freq, guestList, reminder, visibility, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const range = useMemo(() => {
    if (allDay) {
      return {
        start: startOfDay(new Date(`${startDate}T00:00`)).toISOString(),
        end: endOfDay(new Date(`${endDate}T00:00`)).toISOString(),
      };
    }
    return { start: new Date(startTime).toISOString(), end: new Date(endTime).toISOString() };
  }, [allDay, startDate, endDate, startTime, endTime]);

  const clashes = useMemo(() => {
    const others = existing.filter(
      (e) => !(src && e.seriesId === src.seriesId && e.occurrenceStart === src.occurrenceStart)
    );
    return findOverlaps({ start: range.start, end: range.end, allDay }, others);
  }, [existing, src, range.start, range.end, allDay]);

  async function save() {
    setError("");
    if (new Date(range.end) < new Date(range.start)) {
      setError("End time must be after start time.");
      return;
    }
    setSaving(true);
    const payload: EventPayload = {
      title: title.trim() || "(No title)",
      description: description || null,
      location: location || null,
      start: range.start,
      end: range.end,
      allDay,
      color,
      timezone: tz,
      guests: guestList.join(",") || null,
      reminderMinutes: reminder === "" ? null : Number(reminder),
      visibility,
      busy,
      rrule: freq === "none" ? null : `FREQ=${freq.toUpperCase()}`,
    };
    try {
      if (!editing) {
        await createEvent(payload);
        clearDraft();
      } else {
        await updateEvent(src!.seriesId, payload, {
          scope: src!.isRecurring ? scope : "all",
          occurrenceStart: src!.occurrenceStart,
          overrideId: src!.overrideId,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await deleteEvent(src!.seriesId, {
        scope: src!.isRecurring ? scope : "all",
        occurrenceStart: src!.occurrenceStart,
        overrideId: src!.overrideId,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 shrink-0" style={{ background: colorOf(color).solid }} />

        {/* Top bar: hamburger (more options) + close */}
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <button
            onClick={() => setExpanded((x) => !x)}
            title="More options"
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 pb-5">
          <Row icon={null}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full border-b border-neutral-200 bg-transparent pb-1.5 text-xl outline-none focus:border-blue-500 dark:border-neutral-700"
            />
          </Row>

          {/* Time */}
          <Row icon="🕐" align="top">
            <div className="space-y-2">
              {allDay ? (
                <div className="flex items-center gap-2 text-sm">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={timeCls} />
                  <span className="shrink-0 text-neutral-400">→</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={timeCls} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={timeCls} />
                  <span className="shrink-0 text-neutral-400">→</span>
                  <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={timeCls} />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All day
                </label>
                <span className="text-neutral-300">•</span>
                <select value={freq} onChange={(e) => setFreq(e.target.value)} className="bg-transparent text-neutral-600 outline-none dark:text-neutral-300">
                  {FREQS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Row>

          {/* Guests */}
          <Row icon="👥" align="top">
            <input
              value={guestInput}
              onChange={(e) => setGuestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addGuest();
                }
              }}
              onBlur={addGuest}
              placeholder="Add guests (press Enter)"
              className={inputCls}
            />
            {guestList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {guestList.map((g) => (
                  <span key={g} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs dark:bg-neutral-800">
                    {g}
                    <button onClick={() => setGuestList(guestList.filter((x) => x !== g))} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Row>

          {/* Location */}
          <Row icon="📍">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location" className={inputCls} />
          </Row>

          {/* Description */}
          <Row icon="📝" align="top">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add description" rows={2} className={`${inputCls} resize-none`} />
          </Row>

          {/* Reminder */}
          <Row icon="🔔">
            <select value={reminder} onChange={(e) => onReminder(e.target.value)} className={inputCls}>
              {REMINDERS.map((r) => (
                <option key={r.label} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Row>

          {/* Color */}
          <Row icon="🎨">
            <div className="flex items-center gap-2">
              {COLOR_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setColor(k)}
                  title={colorOf(k).name}
                  className={`h-6 w-6 rounded-full transition ${color === k ? "ring-2 ring-neutral-400 ring-offset-2 dark:ring-offset-neutral-900" : ""}`}
                  style={{ background: colorOf(k).solid }}
                />
              ))}
            </div>
          </Row>

          {/* Advanced (toggled by hamburger / More options) */}
          {expanded && (
            <>
              <Row icon="💼">
                <select value={busy ? "busy" : "free"} onChange={(e) => setBusy(e.target.value === "busy")} className={inputCls}>
                  <option value="busy">Busy</option>
                  <option value="free">Free</option>
                </select>
              </Row>
              <Row icon="🔒">
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls}>
                  <option value="default">Default visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </Row>
            </>
          )}

          {clashes.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              ⚠ Overlaps with {clashes.length} other event{clashes.length > 1 ? "s" : ""} ({clashes.slice(0, 2).map((c) => c.title).join(", ")}
              {clashes.length > 2 ? "…" : ""}). You can still save.
            </div>
          )}

          {editing && src!.isRecurring && (
            <div className="flex gap-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={scope === "single"} onChange={() => setScope("single")} /> This event
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} /> All events
              </label>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setExpanded((x) => !x)} className="text-sm font-medium text-blue-600 hover:underline">
              {expanded ? "Fewer options" : "More options"}
            </button>
            {editing && (
              <button onClick={remove} disabled={saving} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// One row of the Google-style icon rail: [icon] [content].
function Row({
  icon,
  children,
  align = "center",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  align?: "center" | "top";
}) {
  return (
    <div className={`grid grid-cols-[24px_1fr] gap-3 ${align === "top" ? "items-start" : "items-center"}`}>
      <div className="pt-1 text-center text-sm text-neutral-400">{icon}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700";

const timeCls =
  "min-w-0 flex-1 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700";

function deriveFreq(occ: Occurrence): string {
  const m = occ.rrule?.match(/FREQ=(\w+)/i);
  return m ? m[1].toLowerCase() : "weekly";
}
