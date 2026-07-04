import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const patchSchema = z.object({ isSuspended: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId: adminId, adminName, unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id },
    data: { isSuspended: parsed.data.isSuspended },
    select: { id: true, isSuspended: true, name: true },
  });

  await logAdminAction({
    adminId,
    adminName,
    action: parsed.data.isSuspended ? "user.suspend" : "user.unsuspend",
    targetType: "user",
    targetId: id,
    details: updated.name,
  });

  return NextResponse.json(updated);
}
