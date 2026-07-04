import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

export async function GET() {
  const { unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const announcements = await db.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, message: true, createdAt: true },
  });

  return NextResponse.json(announcements);
}
