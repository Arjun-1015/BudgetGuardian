"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = ["#6FA787", "#D9A15B", "#C25B4E", "#3F6E67", "#8FB9AA", "#C9975E", "#9C6B62", "#5C837B"];

export function CategoryPieChart({ data }: { data: { category: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ink-soft dark:text-mist/50">
        No expenses logged yet this cycle.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="total" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`₹${Math.round(value).toLocaleString("en-IN")}`, name]}
          contentStyle={{ borderRadius: 12, border: "none", fontFamily: "var(--font-inter)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
