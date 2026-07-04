import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { dependentSchema } from "@/lib/validation";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const dependents = await db.dependent.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(dependents);
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = dependentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const dependent = await db.dependent.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(dependent, { status: 201 });
}
