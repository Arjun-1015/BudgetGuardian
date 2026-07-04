"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface DayEvent {
  type: "expense" | "income" | "bill";
  label: string;
  amount: number;
}

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, DayEvent[]>>({});
  const [loading, setLoading] = useState(true);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() + monthOffset);
  viewDate.setDate(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [expenses, income, bills] = await Promise.all([
      apiFetch<{ date: string; category: string; amount: number }[]>("/api/expenses"),
      apiFetch<{ date: string; source: string; amount: number }[]>("/api/income"),
      apiFetch<{ dueDate: string; name: string; amount: number }[]>("/api/bills"),
    ]);

    const map: Record<string, DayEvent[]> = {};
    const push = (dateStr: string, event: DayEvent) => {
      const key = dateStr.slice(0, 10);
      map[key] = [...(map[key] ?? []), event];
    };
    expenses.forEach((e) => push(e.date, { type: "expense", label: e.category, amount: e.amount }));
    income.forEach((i) => push(i.date, { type: "income", label: i.source, amount: i.amount }));
    bills.forEach((b) => push(b.dueDate, { type: "bill", label: b.name, amount: b.amount }));
    setEvents(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const DOT_COLOR: Record<DayEvent["type"], string> = {
    expense: "bg-danger",
    income: "bg-safe",
    bill: "bg-warning",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">
          {viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset((m) => m - 1)}>
            ← Prev
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset(0)}>
            Today
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setMonthOffset((m) => m + 1)}>
            Next →
          </Button>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-ink-soft dark:text-mist/60">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> Expense</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-safe" /> Income</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Bill</span>
      </div>

      <Card>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-soft dark:text-mist/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dateKey = new Date(year, month, day).toISOString().slice(0, 10);
            const dayEvents = events[dateKey] ?? [];
            const isToday = dateKey === new Date().toISOString().slice(0, 10);
            return (
              <div
                key={i}
                className={cn(
                  "flex min-h-[72px] flex-col gap-1 rounded-xl border border-ink/5 dark:border-white/5 p-2",
                  isToday && "border-brand bg-brand/5"
                )}
              >
                <span className="text-xs text-ink-soft dark:text-mist/50">{day}</span>
                <div className="flex flex-wrap gap-1">
                  {dayEvents.slice(0, 4).map((e, idx) => (
                    <span key={idx} title={`${e.label} · ₹${Math.round(e.amount)}`} className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[e.type])} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      {loading && <p className="text-sm text-ink-soft dark:text-mist/50">Loading calendar…</p>}
    </div>
  );
}
