import { z } from "zod";
import { COLOR_KEYS } from "./colors";

const iso = z.string().datetime({ offset: true });

export const eventInput = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  start: iso,
  end: iso,
  allDay: z.boolean().default(false),
  color: z.enum(COLOR_KEYS as [string, ...string[]]).default("blue"),
  timezone: z.string().default("UTC"),
  rrule: z.string().max(500).nullable().optional(),
}).refine((e) => new Date(e.end) >= new Date(e.start), {
  message: "End must be after start",
  path: ["end"],
});

// How a change to a recurring series should be applied.
export const editScope = z.enum(["single", "all"]).default("all");

export const registerInput = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export type EventInput = z.infer<typeof eventInput>;
