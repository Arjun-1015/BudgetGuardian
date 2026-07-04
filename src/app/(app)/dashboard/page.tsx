import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard-summary";
import { Card, CardLabel } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SurvivalGauge } from "@/components/dashboard/survival-gauge";
import { SalaryCountdown } from "@/components/dashboard/salary-countdown";
import { RiskBadge } from "@/components/ui/risk-badge";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";

// Always render fresh — this reads live, per-user financial data directly
// from the database, so it must never be served from any cache (see the
// staleTimes note in next.config.js for the bug this prevents).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const summary = await getDashboardSummary(userId);
  if (!summary) redirect("/login");
  if (!summary.onboarded) redirect("/onboarding");

  const { prediction, currencySymbol } = summary;

  return (
    <div className="flex flex-col gap-6">
      {prediction.riskLevel === "danger" && (
        <div className="animate-pulse rounded-card border border-danger/30 bg-danger/10 px-5 py-3 text-sm font-medium text-danger">
          {prediction.message}
        </div>
      )}

      <div className="grid animate-fade-in-up grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Available balance" amount={prediction.remainingBalance} currencySymbol={currencySymbol} />
        <StatCard label="Income this cycle" amount={summary.totalIncome} currencySymbol={currencySymbol} tone="positive" />
        <StatCard label="Spent this cycle" amount={summary.totalExpenses} currencySymbol={currencySymbol} tone="negative" />
        <StatCard label="Savings" amount={summary.savings} currencySymbol={currencySymbol} />
      </div>

      <div className="grid animate-fade-in-up grid-cols-1 gap-6 [animation-delay:100ms] lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-4 lg:col-span-1">
          <CardLabel>Salary survival</CardLabel>
          <div className="flex w-full items-center justify-around">
            <SurvivalGauge
              dailyBudget={prediction.dailyBudget}
              riskLevel={prediction.riskLevel}
              currencySymbol={currencySymbol}
            />
          </div>
          <RiskBadge level={prediction.riskLevel} />
          <p className="text-center text-sm text-ink-soft dark:text-mist/60">{prediction.message}</p>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-3 lg:col-span-1">
          <CardLabel>Next salary in</CardLabel>
          <SalaryCountdown daysLeft={prediction.daysLeft} cycleLength={summary.cycleLength} />
          {summary.familyExpenses > 0 && (
            <p className="text-center text-sm text-ink-soft dark:text-mist/60">
              Includes {currencySymbol}
              {Math.round(summary.familyExpenses).toLocaleString("en-IN")}/mo in family expenses
            </p>
          )}
        </Card>

        <Card className="lg:col-span-1">
          <CardLabel>Spending by category</CardLabel>
          <CategoryPieChart data={summary.categoryTotals} />
        </Card>
      </div>

      <Card className="animate-fade-in-up [animation-delay:200ms]">
        <CardLabel>Recent transactions</CardLabel>
        {summary.recentTransactions.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">
            No expenses logged this cycle yet. Add one from the Expenses tab.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
            {summary.recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-ink dark:text-mist">{t.category}</p>
                  <p className="text-ink-soft dark:text-mist/50">
                    {new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </p>
                </div>
                <span className="num font-medium text-ink dark:text-mist">
                  -{currencySymbol}
                  {Math.round(t.amount).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
