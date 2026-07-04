import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { incomeSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

async function assertOwnership(userId: string, id: string) {
  const entry = await db.incomeEntry.findUnique({ where: { id } });
  return entry && entry.userId === userId ? entry : null;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const owned = await assertOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = incomeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = { ...parsed.data, ...(parsed.data.date ? { date: new Date(parsed.data.date) } : {}) };
  const updated = await db.incomeEntry.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const owned = await assertOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.incomeEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
