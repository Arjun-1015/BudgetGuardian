import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import {
  filterByRange,
  totalsByCategory,
  totalsByDay,
  incomeVsExpenseByMonth,
  ReportRange,
  ReportExpense,
  ReportIncome,
} from "@/lib/reports";

// Days-in-range used to prorate recurring monthly salary down to the
// selected window. Approximations (a week isn't exactly 1/4.345 of a
// month) — good enough for a summary figure, not meant to be exact to
// the day the way the dashboard's pay-cycle math is.
const PRORATION_DAYS: Record<ReportRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30.44,
  yearly: 365,
};

export async function GET(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const range = (new URL(req.url).searchParams.get("range") ?? "monthly") as ReportRange;

  const [user, allExpenses, allIncome] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { monthlyIncome: true, otherIncome: true } }),
    db.expense.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
    }) as Promise<ReportExpense[]>,
    db.incomeEntry.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
    }) as Promise<ReportIncome[]>,
  ]);

  const rangedExpenses = filterByRange(allExpenses, range);
  const totalExpense = rangedExpenses.reduce((sum: number, e: ReportExpense) => sum + e.amount, 0);

  const rangedIncome = filterByRange(allIncome, range);
  const loggedIncome = rangedIncome.reduce((sum: number, i: ReportIncome) => sum + i.amount, 0);

  // Recurring salary prorated to the selected window, so "Income" here
  // means the same thing it does on the dashboard (salary + other income
  // + anything logged), not just manually-logged entries.
  const recurringMonthly = (user?.monthlyIncome ?? 0) + (user?.otherIncome ?? 0);
  const proratedRecurring = (recurringMonthly / 30.44) * PRORATION_DAYS[range];
  const totalIncome = loggedIncome + proratedRecurring;

  return NextResponse.json({
    range,
    totalExpense,
    totalIncome,
    byCategory: totalsByCategory(rangedExpenses),
    byDay: totalsByDay(allExpenses), // full 6mo window for the heatmap
    incomeVsExpense: incomeVsExpenseByMonth(allExpenses, allIncome, 6),
  });
}
