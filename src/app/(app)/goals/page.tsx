"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
}

const SUGGESTIONS = ["Emergency Fund", "Vacation", "Car", "House", "Education", "Wedding", "Electronics"];

const emptyForm = { name: "", targetAmount: "", targetDate: "" };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Tracks id + delta together so only the exact button clicked shows a
  // spinner, not both +500 and +1000 on the same card.
  const [progressPending, setProgressPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGoals(await apiFetch<Goal[]>("/api/goals"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          targetAmount: Number(form.targetAmount),
          currentAmount: 0,
          targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : undefined,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create goal");
    } finally {
      setSaving(false);
    }
  }

  async function addProgress(goal: Goal, delta: number) {
    const key = `${goal.id}-${delta}`;
    setProgressPending(key);
    const newAmount = Math.max(0, goal.currentAmount + delta);
    setGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, currentAmount: newAmount } : g)));
    try {
      await apiFetch(`/api/goals/${goal.id}`, { method: "PATCH", body: JSON.stringify({ currentAmount: newAmount }) });
    } catch (err) {
      setGoals((gs) => gs.map((g) => (g.id === goal.id ? { ...g, currentAmount: goal.currentAmount } : g)));
      setError(err instanceof ApiError ? err.message : "Failed to update progress");
    } finally {
      setProgressPending(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete goal");
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Budget goals</h1>
        <Button onClick={() => setShowForm((s) => !s)}>+ New goal</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, name: s }))}
                  className="rounded-pill border border-ink/10 dark:border-white/15 px-3 py-1 text-xs text-ink-soft dark:text-mist/70 hover:bg-ink/5 dark:hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Goal name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                label="Target amount"
                type="number"
                min="0"
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                required
              />
              <Input
                label="Target date (optional)"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? "Creating…" : "Create goal"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100) || 0);
          const isDeleting = deletingId === goal.id;
          return (
            <Card key={goal.id}>
              <div className="mb-2 flex items-center justify-between">
                <CardLabel>{goal.name}</CardLabel>
                <Button
                  size="sm"
                  variant="ghost"
                  className="!px-2 !py-0.5 text-xs text-danger"
                  onClick={() => handleDelete(goal.id)}
                  loading={isDeleting}
                >
                  {isDeleting ? "Removing…" : "Remove"}
                </Button>
              </div>
              <p className="num mb-3 text-xl font-semibold text-ink dark:text-mist">
                ₹{Math.round(goal.currentAmount).toLocaleString("en-IN")}{" "}
                <span className="text-sm font-normal text-ink-soft dark:text-mist/50">
                  of ₹{Math.round(goal.targetAmount).toLocaleString("en-IN")}
                </span>
              </p>
              <div className="mb-3 h-2.5 w-full overflow-hidden rounded-pill bg-ink/10 dark:bg-white/10">
                <div className="h-full rounded-pill bg-brand transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addProgress(goal, 500)}
                  loading={progressPending === `${goal.id}-500`}
                  disabled={isDeleting}
                >
                  +₹500
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addProgress(goal, 1000)}
                  loading={progressPending === `${goal.id}-1000`}
                  disabled={isDeleting}
                >
                  +₹1,000
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {!loading && goals.length === 0 && (
        <Card>
          <p className="text-sm text-ink-soft dark:text-mist/50">
            No goals yet. Try Emergency Fund or Vacation to get started.
          </p>
        </Card>
      )}
    </div>
  );
}
