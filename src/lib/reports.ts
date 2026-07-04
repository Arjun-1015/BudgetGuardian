export interface ReportExpense {
  amount: number;
  category: string;
  date: Date;
}
export interface ReportIncome {
  amount: number;
  date: Date;
}

export type ReportRange = "daily" | "weekly" | "monthly" | "yearly";

function startOfRange(range: ReportRange, today: Date): Date {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  switch (range) {
    case "daily":
      return d;
    case "weekly": {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d;
    }
    case "monthly":
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case "yearly":
      return new Date(d.getFullYear(), 0, 1);
  }
}

export function filterByRange<T extends { date: Date }>(items: T[], range: ReportRange, today = new Date()): T[] {
  const start = startOfRange(range, today);
  return items.filter((i) => i.date.getTime() >= start.getTime());
}

export function totalsByCategory(expenses: ReportExpense[]): { category: string; total: number }[] {
  const map: Record<string, number> = {};
  for (const e of expenses) map[e.category] = (map[e.category] ?? 0) + e.amount;
  return Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/** Buckets expenses by ISO date (YYYY-MM-DD) — used for the daily heatmap
 * and the monthly spending line chart. */
export function totalsByDay(expenses: ReportExpense[]): { date: string; total: number }[] {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const key = e.date.toISOString().slice(0, 10);
    map[key] = (map[key] ?? 0) + e.amount;
  }
  return Object.entries(map)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function incomeVsExpenseByMonth(
  expenses: ReportExpense[],
  income: ReportIncome[],
  months = 6
): { month: string; income: number; expense: number }[] {
  const now = new Date();
  const buckets: { month: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), income: 0, expense: 0 });
  }
  const monthKey = (d: Date) => d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
  for (const e of expenses) {
    const key = monthKey(e.date);
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.expense += e.amount;
  }
  for (const inc of income) {
    const key = monthKey(inc.date);
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.income += inc.amount;
  }
  return buckets;
}
