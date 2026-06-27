import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerInput } from "@/lib/validation";

export async function POST(req: Request) {
  const parsed = registerInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      hashedPassword: await bcrypt.hash(password, 10),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
