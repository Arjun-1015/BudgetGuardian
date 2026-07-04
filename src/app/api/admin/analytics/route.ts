import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/require-user";

export async function GET() {
  const { unauthorized } = await requireAdminId();
  if (unauthorized) return unauthorized;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    suspendedUsers,
    onboardedUsers,
    totalExpenses,
    expenseSum,
    recentSignups,
    categoryBreakdown,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isSuspended: true } }),
    db.user.count({ where: { onboardedAt: { not: null } } }),
    db.expense.count(),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    db.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 8,
    }),
  ]);

  // Bucket signups by day for a simple trend line.
  const signupsByDay: Record<string, number> = {};
  for (const u of recentSignups) {
    const key = u.createdAt.toISOString().slice(0, 10);
    signupsByDay[key] = (signupsByDay[key] ?? 0) + 1;
  }
  const signupTrend = Object.entries(signupsByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    totalUsers,
    suspendedUsers,
    onboardedUsers,
    unonboardedUsers: totalUsers - onboardedUsers,
    totalExpenses,
    totalExpenseAmount: expenseSum._sum.amount ?? 0,
    signupTrend,
    categoryBreakdown: categoryBreakdown.map((c: { category: string; _sum: { amount: number | null } }) => ({
      category: c.category,
      total: c._sum.amount ?? 0,
    })),
  });
}
