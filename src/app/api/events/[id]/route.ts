import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/session";
import { eventInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Confirm the base row exists and belongs to the caller.
async function ownedBase(id: string, userId: string) {
  const base = await prisma.event.findUnique({ where: { id } });
  if (!base || base.userId !== userId) return null;
  return base;
}

// PATCH /api/events/:id   (:id = the series/base id)
// body: { ...eventFields, scope: "single" | "all", occurrenceStart?, overrideId? }
export async function PATCH(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = eventInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }

  const base = await ownedBase(id, userId);
  if (!base) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const d = parsed.data;
  const fields = {
    title: d.title?.trim() || "(No title)",
    description: d.description ?? null,
    location: d.location ?? null,
    startUtc: new Date(d.start),
    endUtc: new Date(d.end),
    allDay: d.allDay,
    color: d.color,
    timezone: d.timezone,
    guests: d.guests ?? null,
    reminderMinutes: d.reminderMinutes ?? null,
    visibility: d.visibility,
    busy: d.busy,
  };

  const scope = body?.scope === "single" ? "single" : "all";

  // Whole series (or a plain one-off): edit the base row in place.
  if (scope === "all" || !base.rrule) {
    const event = await prisma.event.update({
      where: { id: base.id },
      data: { ...fields, rrule: d.rrule ?? base.rrule },
    });
    return NextResponse.json({ event });
  }

  // Single occurrence of a series: update its override, or create one.
  if (body?.overrideId) {
    const event = await prisma.event.update({
      where: { id: body.overrideId },
      data: fields,
    });
    return NextResponse.json({ event });
  }

  if (!body?.occurrenceStart) {
    return NextResponse.json({ error: "occurrenceStart required" }, { status: 400 });
  }
  const event = await prisma.event.create({
    data: {
      userId,
      ...fields,
      recurringEventId: base.id,
      originalStartUtc: new Date(body.occurrenceStart),
    },
  });
  return NextResponse.json({ event }, { status: 201 });
}

// DELETE /api/events/:id?scope=single|all&occurrenceStart=ISO&overrideId=ID
export async function DELETE(req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") === "single" ? "single" : "all";
  const occurrenceStart = searchParams.get("occurrenceStart");
  const overrideId = searchParams.get("overrideId");

  const base = await ownedBase(id, userId);
  if (!base) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Whole series (or one-off): drop the base and any overrides hanging off it.
  if (scope === "all" || !base.rrule) {
    await prisma.event.deleteMany({ where: { recurringEventId: base.id } });
    await prisma.event.delete({ where: { id: base.id } });
    return NextResponse.json({ ok: true });
  }

  // Single occurrence: mark it cancelled (tombstone), reusing any existing override.
  if (overrideId) {
    await prisma.event.update({ where: { id: overrideId }, data: { cancelled: true } });
    return NextResponse.json({ ok: true });
  }
  if (!occurrenceStart) {
    return NextResponse.json({ error: "occurrenceStart required" }, { status: 400 });
  }
  await prisma.event.create({
    data: {
      userId,
      title: base.title,
      startUtc: new Date(occurrenceStart),
      endUtc: new Date(occurrenceStart),
      timezone: base.timezone,
      recurringEventId: base.id,
      originalStartUtc: new Date(occurrenceStart),
      cancelled: true,
    },
  });
  return NextResponse.json({ ok: true });
}
