import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const patchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: adminId, adminName, unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await db.announcement.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  await logAdminAction({
    adminId,
    adminName,
    action: parsed.data.isActive ? "announcement.activate" : "announcement.deactivate",
    targetType: "announcement",
    targetId: id,
    details: updated.title,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: adminId, adminName, unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const existing = await db.announcement.findUnique({ where: { id } });
  await db.announcement.delete({ where: { id } });

  await logAdminAction({
    adminId,
    adminName,
    action: "announcement.delete",
    targetType: "announcement",
    targetId: id,
    details: existing?.title,
  });

  return NextResponse.json({ ok: true });
}
