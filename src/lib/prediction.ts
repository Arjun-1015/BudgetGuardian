export type RiskLevel = "safe" | "warning" | "danger";

export interface PredictionInput {
  /** Total income expected this cycle (monthly salary + other income + any
   * extra income entries logged since the cycle started). */
  totalIncomeThisCycle: number;
  /** Sum of expenses logged since the current cycle started. */
  totalExpensesThisCycle: number;
  /** Day-of-month the next salary lands (1-31). Months shorter than this
   * clamp to their actual last day — e.g. 31 lands on Feb 28/29, Apr 30,
   * May 31, and so on, same way most real payroll systems handle it. */
  salaryDate: number;
  /** "Today", injectable for tests. */
  today?: Date;
  /** Average daily spend over the trailing ~30-90 days, used to set
   * risk thresholds relative to the user's own habits instead of a
   * hardcoded number that means something different for every income
   * level. Undefined when there isn't enough history yet. */
  historicalAvgDailySpend?: number;
}

export interface PredictionResult {
  remainingBalance: number;
  daysLeft: number;
  dailyBudget: number;
  riskLevel: RiskLevel;
  nextSalaryDate: Date;
  message: string;
}

function daysInMonth(year: number, month: number): number {
  // Passing month=12 (or -1, etc.) is intentional and safe — Date
  // normalizes month overflow/underflow correctly (unlike day-of-month
  // overflow, which is the actual bug being avoided here).
  return new Date(year, month + 1, 0).getDate();
}

/** Builds a date for (year, month, day), clamping day down to that
 * month's actual last day if it doesn't have that many days — e.g.
 * (2026, 1, 31) for February becomes Feb 28, not a rolled-over March date. */
function clampedMonthDate(year: number, month: number, day: number): Date {
  const clampedDay = Math.min(day, daysInMonth(year, month));
  const d = new Date(year, month, clampedDay);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Finds the next occurrence of `salaryDate` (day-of-month) on or after
 * `today`. If today's day-of-month has already passed the salary day,
 * rolls to next month. */
export function getNextSalaryDate(salaryDate: number, today: Date): Date {
  const day = Math.min(Math.max(salaryDate, 1), 31);
  const candidate = clampedMonthDate(today.getFullYear(), today.getMonth(), day);
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  if (candidate.getTime() <= todayMidnight.getTime()) {
    return clampedMonthDate(today.getFullYear(), today.getMonth() + 1, day);
  }
  return candidate;
}

/** Finds when the current spending cycle began — i.e. the most recent
 * salary date on or before today. */
export function getCurrentCycleStart(salaryDate: number, today: Date): Date {
  const next = getNextSalaryDate(salaryDate, today);
  const day = Math.min(Math.max(salaryDate, 1), 31);
  return clampedMonthDate(next.getFullYear(), next.getMonth() - 1, day);
}

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bMid - aMid) / MS_PER_DAY);
}

export function predictSurvival(input: PredictionInput): PredictionResult {
  const today = input.today ?? new Date();
  const nextSalaryDate = getNextSalaryDate(input.salaryDate, today);
  const daysLeft = Math.max(daysBetween(today, nextSalaryDate), 1);

  const remainingBalance =
    input.totalIncomeThisCycle - input.totalExpensesThisCycle;
  const dailyBudget = remainingBalance / daysLeft;

  const riskLevel = classifyRisk(dailyBudget, input.historicalAvgDailySpend);

  return {
    remainingBalance,
    daysLeft,
    dailyBudget,
    riskLevel,
    nextSalaryDate,
    message: riskMessage(riskLevel, dailyBudget),
  };
}

/** Thresholds are relative to the user's own historical spend, so the
 * same numeric daily budget means something different for a ₹500/day
 * spender than a ₹5000/day spender — the system adapts per user rather
 * than using one hardcoded cutoff for everyone. Falls back to a simple
 * positive/negative check when there isn't enough history yet. */
function classifyRisk(
  dailyBudget: number,
  historicalAvgDailySpend?: number
): RiskLevel {
  if (dailyBudget <= 0) return "danger";

  if (!historicalAvgDailySpend || historicalAvgDailySpend <= 0) {
    // No history yet — fall back to a conservative absolute check.
    if (dailyBudget < 100) return "danger";
    if (dailyBudget < 300) return "warning";
    return "safe";
  }

  const ratio = dailyBudget / historicalAvgDailySpend;
  if (ratio < 0.6) return "danger";
  if (ratio < 1.0) return "warning";
  return "safe";
}

function riskMessage(level: RiskLevel, dailyBudget: number): string {
  const amount = Math.round(dailyBudget).toLocaleString("en-IN");
  switch (level) {
    case "danger":
      return dailyBudget <= 0
        ? "You're projected to run out of money before your next salary."
        : `You may run out of money before payday at this pace. Try to stay under ₹${amount}/day.`;
    case "warning":
      return `Tight but manageable — aim to keep spending near ₹${amount}/day.`;
    case "safe":
    default:
      return `You're on track. Safe to spend about ₹${amount}/day.`;
  }
}
