import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { goalSchema } from "@/lib/validation";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const goals = await db.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { targetDate, ...rest } = parsed.data;
  const goal = await db.goal.create({
    data: { ...rest, userId, targetDate: targetDate ? new Date(targetDate) : null },
  });
  return NextResponse.json(goal, { status: 201 });
}
