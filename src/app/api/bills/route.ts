import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { billSchema } from "@/lib/validation";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const bills = await db.bill.findMany({ where: { userId }, orderBy: { dueDate: "asc" } });
  return NextResponse.json(bills);
}

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const bill = await db.bill.create({
    data: { ...parsed.data, dueDate: new Date(parsed.data.dueDate), userId },
  });
  return NextResponse.json(bill, { status: 201 });
}
