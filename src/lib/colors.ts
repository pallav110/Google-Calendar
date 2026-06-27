// Google Calendar's named event palette. Each has a solid (block) and soft (chip) tone.
export const EVENT_COLORS = {
  blue: { name: "Blueberry", solid: "#3b82f6", soft: "#dbeafe", text: "#1e3a8a" },
  green: { name: "Basil", solid: "#16a34a", soft: "#dcfce7", text: "#14532d" },
  red: { name: "Tomato", solid: "#ef4444", soft: "#fee2e2", text: "#7f1d1d" },
  amber: { name: "Banana", solid: "#f59e0b", soft: "#fef3c7", text: "#78350f" },
  purple: { name: "Grape", solid: "#9333ea", soft: "#f3e8ff", text: "#581c87" },
  teal: { name: "Peacock", solid: "#0d9488", soft: "#ccfbf1", text: "#134e4a" },
  pink: { name: "Flamingo", solid: "#ec4899", soft: "#fce7f3", text: "#831843" },
  gray: { name: "Graphite", solid: "#6b7280", soft: "#f3f4f6", text: "#374151" },
} as const;

export type EventColor = keyof typeof EVENT_COLORS;

export const COLOR_KEYS = Object.keys(EVENT_COLORS) as EventColor[];

export function colorOf(key: string) {
  return EVENT_COLORS[(key as EventColor)] ?? EVENT_COLORS.blue;
}
