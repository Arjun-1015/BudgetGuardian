import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";
import { logAdminAction } from "@/lib/audit-log";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  message: z.string().min(1, "Message is required").max(1000),
});

export async function GET() {
  const { unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const announcements = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const { userId: adminId, adminName, unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const announcement = await db.announcement.create({
    data: {
      title: parsed.data.title,
      message: parsed.data.message,
      createdBy: adminId,
      createdByName: adminName,
    },
  });

  await logAdminAction({
    adminId,
    adminName,
    action: "announcement.create",
    targetType: "announcement",
    targetId: announcement.id,
    details: parsed.data.title,
  });

  return NextResponse.json(announcement, { status: 201 });
}
