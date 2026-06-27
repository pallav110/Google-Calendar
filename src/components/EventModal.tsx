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

  const [freq, setFreq] = useState(
    draft?.freq ?? (src?.isRecurring ? deriveFreq(src) : "none")
  );
  const [scope, setScope] = useState<EditScope>("single");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Persist the in-progress NEW event so a reload / offline drop doesn't lose it.
  useEffect(() => {
    if (editing) return;
    saveDraft({ title, description, location, start: startTime, end: endTime, allDay, color, freq });
  }, [editing, title, description, location, startTime, endTime, allDay, color, freq]);

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

  // Overlap warning — excludes the event being edited.
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
    setBusy(true);
    const payload: EventPayload = {
      title: title.trim() || "(No title)",
      description: description || null,
      location: location || null,
      start: range.start,
      end: range.end,
      allDay,
      color,
      timezone: tz,
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
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteEvent(src!.seriesId, {
        scope: src!.isRecurring ? scope : "all",
        occurrenceStart: src!.occurrenceStart,
        overrideId: src!.overrideId,
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
      setBusy(false);
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
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-900"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-1.5" style={{ background: colorOf(color).solid }} />
        <div className="space-y-4 p-5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full border-b border-neutral-200 bg-transparent pb-2 text-xl outline-none focus:border-blue-500 dark:border-neutral-700"
          />

          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            All day
          </label>

          {allDay ? (
            <div className="flex items-center gap-2 text-sm">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
              <span className="text-neutral-400">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
              <span className="text-neutral-400">→</span>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
            </div>
          )}

          <select value={freq} onChange={(e) => setFreq(e.target.value)} className={inputCls}>
            {FREQS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location"
            className={inputCls}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description"
            rows={2}
            className={`${inputCls} resize-none`}
          />

          <div className="flex items-center gap-2">
            {COLOR_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => setColor(k)}
                title={colorOf(k).name}
                className={`h-6 w-6 rounded-full transition ${color === k ? "ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900" : ""}`}
                style={{ background: colorOf(k).solid }}
              />
            ))}
          </div>

          {clashes.length > 0 && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              ⚠ Overlaps with {clashes.length} other event{clashes.length > 1 ? "s" : ""} ({clashes
                .slice(0, 2)
                .map((c) => c.title)
                .join(", ")}
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

          <div className="flex items-center justify-between pt-1">
            {editing ? (
              <button onClick={remove} disabled={busy} className="text-sm text-red-600 hover:underline">
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-full px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700";

function deriveFreq(occ: Occurrence): string {
  const m = occ.rrule?.match(/FREQ=(\w+)/i);
  return m ? m[1].toLowerCase() : "weekly";
}
