import type { Occurrence } from "./recurrence";

export type EventPayload = {
  title: string;
  description?: string | null;
  location?: string | null;
  start: string; // ISO UTC
  end: string; // ISO UTC
  allDay: boolean;
  color: string;
  timezone: string;
  guests?: string | null;
  reminderMinutes?: number | null;
  visibility?: string;
  busy?: boolean;
  rrule?: string | null;
};

export type EditScope = "single" | "all";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listEvents(from: Date, to: Date): Promise<Occurrence[]> {
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  const data = await json<{ events: Occurrence[] }>(await fetch(`/api/events?${params}`));
  return data.events;
}

export function createEvent(payload: EventPayload) {
  return fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(json);
}

export function updateEvent(
  seriesId: string,
  payload: EventPayload,
  opts: { scope: EditScope; occurrenceStart?: string; overrideId?: string | null }
) {
  return fetch(`/api/events/${seriesId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, ...opts }),
  }).then(json);
}

export function deleteEvent(
  seriesId: string,
  opts: { scope: EditScope; occurrenceStart?: string; overrideId?: string | null }
) {
  const params = new URLSearchParams({ scope: opts.scope });
  if (opts.occurrenceStart) params.set("occurrenceStart", opts.occurrenceStart);
  if (opts.overrideId) params.set("overrideId", opts.overrideId);
  return fetch(`/api/events/${seriesId}?${params}`, { method: "DELETE" }).then(json);
}
