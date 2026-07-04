import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { expenseSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q");

  const expenses = await db.expense.findMany({
    where: {
      userId,
      ...(category ? { category } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { notes: { contains: q } },
              { category: { contains: q } },
              { paymentMethod: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const expense = await db.expense.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), userId },
  });
  return NextResponse.json(expense, { status: 201 });
}
