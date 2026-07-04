import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { incomeSchema } from "@/lib/validation";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const income = await db.incomeEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(income);
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = incomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const entry = await db.incomeEntry.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), userId },
  });
  return NextResponse.json(entry, { status: 201 });
}
