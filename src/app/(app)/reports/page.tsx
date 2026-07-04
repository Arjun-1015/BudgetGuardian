"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type Range = "daily" | "weekly" | "monthly" | "yearly";

interface ReportData {
  range: Range;
  totalExpense: number;
  totalIncome: number;
  byCategory: { category: string; total: number }[];
  byDay: { date: string; total: number }[];
  incomeVsExpense: { month: string; income: number; expense: number }[];
}

const RANGES: { value: Range; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "yearly", label: "This year" },
];

function heatColor(value: number, max: number) {
  if (value === 0) return "bg-ink/5 dark:bg-white/5";
  const intensity = Math.min(1, value / (max || 1));
  if (intensity < 0.25) return "bg-safe/30";
  if (intensity < 0.5) return "bg-warning/40";
  if (intensity < 0.75) return "bg-warning/70";
  return "bg-danger/80";
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("monthly");
  const [data, setData] = useState<ReportData | null>(null);

  const load = useCallback(async (r: Range) => {
    const result = await apiFetch<ReportData>(`/api/reports?range=${r}`);
    setData(result);
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const last30Days = data?.byDay.slice(-30) ?? [];
  const maxDay = Math.max(...last30Days.map((d) => d.total), 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Reports</h1>
        <div className="flex gap-2">
          <a href="/api/export/csv" download>
            <Button variant="secondary" size="sm">Export CSV</Button>
          </a>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              range === r.value
                ? "bg-brand text-mist"
                : "bg-white/60 dark:bg-white/5 text-ink-soft dark:text-mist/70 hover:bg-white/90 dark:hover:bg-white/10"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardLabel>Income</CardLabel>
              <p className="num mt-2 text-2xl font-semibold text-safe">
                ₹{Math.round(data.totalIncome).toLocaleString("en-IN")}
              </p>
            </Card>
            <Card>
              <CardLabel>Expenses</CardLabel>
              <p className="num mt-2 text-2xl font-semibold text-danger">
                ₹{Math.round(data.totalExpense).toLocaleString("en-IN")}
              </p>
            </Card>
          </div>

          <Card>
            <div className="mb-1 flex items-center justify-between">
              <CardLabel>Income vs expense — last 6 months</CardLabel>
              <span className="text-xs text-ink-soft/60 dark:text-mist/40">Always 6 months, independent of the filter above</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`} contentStyle={{ borderRadius: 12, border: "none" }} />
                <Bar dataKey="income" fill="#6FA787" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#C25B4E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardLabel>Spending by category</CardLabel>
              <CategoryPieChart data={data.byCategory} />
            </Card>

            <Card>
              <CardLabel>Daily spend heatmap — last 30 days</CardLabel>
              <div className="mt-4 grid grid-cols-10 gap-1.5">
                {last30Days.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ₹${Math.round(d.total).toLocaleString("en-IN")}`}
                    className={cn("aspect-square rounded-md", heatColor(d.total, maxDay))}
                  />
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
