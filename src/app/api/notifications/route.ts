import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { getDashboardSummary } from "@/lib/dashboard-summary";
import { buildNotifications } from "@/lib/notifications";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const summary = await getDashboardSummary(userId);
  if (!summary) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [todaysExpenses, upcomingBills] = await Promise.all([
    db.expense.findMany({ where: { userId, date: { gte: startOfToday } } }),
    db.bill.findMany({ where: { userId, isPaid: false } }),
  ]);

  const todaysSpend = todaysExpenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

  const notifications = buildNotifications({
    riskLevel: summary.prediction.riskLevel,
    daysLeft: summary.prediction.daysLeft,
    dailyBudget: summary.prediction.dailyBudget,
    todaysSpend,
    remainingBalance: summary.prediction.remainingBalance,
    upcomingBills: upcomingBills.map((b: { id: string; name: string; amount: number; dueDate: Date; isPaid: boolean }) => b),
    today,
  });

  return NextResponse.json(notifications);
}
