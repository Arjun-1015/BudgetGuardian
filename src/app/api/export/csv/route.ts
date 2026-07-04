import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const expenses = await db.expense.findMany({
    where: {
      userId,
      ...(from || to
        ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    orderBy: { date: "desc" },
  });

  const header = ["Date", "Category", "Amount", "Payment Method", "Recurring", "Notes"];
  const rows = expenses.map((e: { date: Date; category: string; amount: number; paymentMethod: string; isRecurring: boolean; notes: string | null }) => [
    e.date.toISOString().slice(0, 10),
    e.category,
    e.amount.toFixed(2),
    e.paymentMethod,
    e.isRecurring ? "Yes" : "No",
    e.notes ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell: string) => csvEscape(String(cell))).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
