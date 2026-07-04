import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { getDashboardSummary } from "@/lib/dashboard-summary";
import { buildRuleBasedInsights, generateAiSummary, CategoryWeek } from "@/lib/advisor";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const summary = await getDashboardSummary(userId);
  if (!summary) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const [thisWeekExpenses, lastWeekExpenses] = await Promise.all([
    db.expense.findMany({ where: { userId, date: { gte: startOfThisWeek } } }),
    db.expense.findMany({ where: { userId, date: { gte: startOfLastWeek, lt: startOfThisWeek } } }),
  ]);

  const categoriesSeen = new Set([
    ...thisWeekExpenses.map((e: { category: string }) => e.category),
    ...lastWeekExpenses.map((e: { category: string }) => e.category),
  ]);

  const categories: CategoryWeek[] = Array.from(categoriesSeen).map((category) => ({
    category,
    thisWeek: thisWeekExpenses
      .filter((e: { category: string }) => e.category === category)
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0),
    lastWeek: lastWeekExpenses
      .filter((e: { category: string }) => e.category === category)
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0),
  }));

  const insights = buildRuleBasedInsights(categories, summary.prediction.dailyBudget, summary.currencySymbol);
  const aiSummary = await generateAiSummary(insights);

  return NextResponse.json({ insights, aiSummary });
}
