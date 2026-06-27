// Offline draft support: an in-progress new event survives reloads / connection
// drops by living in localStorage until it is saved or discarded.
const KEY = "gcal:event-draft";

export type Draft = {
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  freq: string;
};

export function saveDraft(draft: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // storage full / unavailable — drafts are best-effort, so ignore.
  }
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
