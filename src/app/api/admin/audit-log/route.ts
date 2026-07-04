import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";

export async function GET() {
  const { unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const entries = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(entries);
}
