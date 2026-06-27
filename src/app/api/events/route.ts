import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { eventInput } from "@/lib/validation";
import { expand } from "@/lib/recurrence";

// GET /api/events?from=ISO&to=ISO  -> expanded occurrences in that window.
export async function GET(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = new Date(searchParams.get("from") ?? "");
  const to = new Date(searchParams.get("to") ?? "");
  if (isNaN(+from) || isNaN(+to)) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  // Pull one-offs intersecting the window, plus every recurring base and override
  // (their occurrences may land in the window regardless of the base's own date).
  const rows = await prisma.event.findMany({
    where: {
      userId,
      OR: [
        { rrule: { not: null } },
        { recurringEventId: { not: null } },
        { startUtc: { lt: to }, endUtc: { gt: from } },
      ],
    },
  });

  return NextResponse.json({ events: expand(rows, from, to) });
}

// POST /api/events  -> create a one-off or recurring base event.
export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = eventInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const d = parsed.data;

  const event = await prisma.event.create({
    data: {
      userId,
      title: d.title?.trim() || "(No title)",
      description: d.description ?? null,
      location: d.location ?? null,
      startUtc: new Date(d.start),
      endUtc: new Date(d.end),
      allDay: d.allDay,
      color: d.color,
      timezone: d.timezone,
      rrule: d.rrule ?? null,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
