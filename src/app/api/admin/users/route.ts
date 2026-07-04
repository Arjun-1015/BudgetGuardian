import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";

export async function GET() {
  const { unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      isAdmin: true,
      isSuspended: true,
      onboardedAt: true,
      createdAt: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
