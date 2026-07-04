import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { dependentSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

async function assertOwnership(userId: string, id: string) {
  const dependent = await db.dependent.findUnique({ where: { id } });
  return dependent && dependent.userId === userId ? dependent : null;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const owned = await assertOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = dependentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await db.dependent.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const owned = await assertOwnership(userId, id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.dependent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
