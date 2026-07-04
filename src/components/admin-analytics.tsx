"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Card, CardLabel } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface Analytics {
  totalUsers: number;
  suspendedUsers: number;
  onboardedUsers: number;
  unonboardedUsers: number;
  totalExpenses: number;
  totalExpenseAmount: number;
  signupTrend: { date: string; count: number }[];
  categoryBreakdown: { category: string; total: number }[];
}

export function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Analytics>("/api/admin/analytics")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-soft dark:text-mist/50">Loading analytics…</p>;
  if (!data) return <p className="text-sm text-danger">Failed to load analytics.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardLabel>Total users</CardLabel>
          <p className="num mt-2 text-2xl font-semibold text-ink dark:text-mist">{data.totalUsers}</p>
        </Card>
        <Card>
          <CardLabel>Onboarded</CardLabel>
          <p className="num mt-2 text-2xl font-semibold text-safe">{data.onboardedUsers}</p>
        </Card>
        <Card>
          <CardLabel>Suspended</CardLabel>
          <p className="num mt-2 text-2xl font-semibold text-danger">{data.suspendedUsers}</p>
        </Card>
        <Card>
          <CardLabel>Expenses logged</CardLabel>
          <p className="num mt-2 text-2xl font-semibold text-ink dark:text-mist">{data.totalExpenses}</p>
        </Card>
      </div>

      <Card>
        <CardLabel>Total expense volume (all users)</CardLabel>
        <p className="num mt-2 text-3xl font-semibold text-ink dark:text-mist">
          ₹{Math.round(data.totalExpenseAmount).toLocaleString("en-IN")}
        </p>
      </Card>

      <Card>
        <CardLabel>Signups — last 30 days</CardLabel>
        {data.signupTrend.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No signups in the last 30 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.signupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} />
              <Line type="monotone" dataKey="count" stroke="#3F6E67" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <CardLabel>Top categories platform-wide</CardLabel>
        {data.categoryBreakdown.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No expenses logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                formatter={(v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`}
                contentStyle={{ borderRadius: 12, border: "none" }}
              />
              <Bar dataKey="total" fill="#6FA787" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
