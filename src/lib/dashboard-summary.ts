import { db } from "@/lib/db";
import { getCurrentCycleStart, predictSurvival } from "@/lib/prediction";
import { CURRENCY_SYMBOLS } from "@/lib/constants";

// Structural types matching the Prisma models we read here. Kept local
// (rather than imported from @prisma/client) so this file type-checks
// even before `prisma generate` has run against a real database.
interface ExpenseLike {
  amount: number;
  category: string;
  date: Date;
}
interface AmountLike {
  amount: number;
}

export async function getDashboardSummary(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const today = new Date();
  const cycleStart = getCurrentCycleStart(user.salaryDate, today);

  const [expensesThisCycle, incomeThisCycle, dependents, last90DaysExpenses] = await Promise.all([
    db.expense.findMany({ where: { userId, date: { gte: cycleStart } } }),
    db.incomeEntry.findMany({ where: { userId, date: { gte: cycleStart } } }),
    db.dependent.findMany({ where: { userId } }),
    db.expense.findMany({
      where: { userId, date: { gte: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000) } },
      select: { amount: true, date: true },
    }),
  ]);

  const totalExpensesThisCycle = (expensesThisCycle as ExpenseLike[]).reduce(
    (sum: number, e: ExpenseLike) => sum + e.amount,
    0
  );
  const extraIncomeThisCycle = (incomeThisCycle as AmountLike[]).reduce(
    (sum: number, i: AmountLike) => sum + i.amount,
    0
  );
  const familyExpenses = (dependents as { monthlyExpense: number }[]).reduce(
    (sum: number, d: { monthlyExpense: number }) => sum + d.monthlyExpense,
    0
  );
  const totalIncomeThisCycle = user.monthlyIncome + user.otherIncome + extraIncomeThisCycle;

  const historicalAvgDailySpend =
    last90DaysExpenses.length > 0
      ? (last90DaysExpenses as AmountLike[]).reduce((sum: number, e: AmountLike) => sum + e.amount, 0) / 90
      : undefined;

  const prediction = predictSurvival({
    totalIncomeThisCycle,
    totalExpensesThisCycle,
    salaryDate: user.salaryDate,
    today,
    historicalAvgDailySpend,
  });

  const categoryMap: Record<string, number> = {};
  for (const e of expensesThisCycle as ExpenseLike[]) {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
  }
  const categoryTotals: { category: string; total: number }[] = Object.entries(categoryMap).map(
    ([category, total]) => ({ category, total })
  );

  const recentTransactions = [...expensesThisCycle].sort(
    (a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime()
  ).slice(0, 8);

  const cycleLength = Math.round(
    (prediction.nextSalaryDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    currency: user.currency,
    currencySymbol: CURRENCY_SYMBOLS[user.currency] ?? user.currency,
    totalIncome: totalIncomeThisCycle,
    totalExpenses: totalExpensesThisCycle,
    savings: Math.max(totalIncomeThisCycle - totalExpensesThisCycle, 0),
    familyExpenses,
    prediction,
    cycleLength,
    categoryTotals,
    recentTransactions,
    onboarded: Boolean(user.onboardedAt),
  };
}

export type DashboardSummary = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
