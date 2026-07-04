"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BILL_CATEGORIES } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface Bill {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isRecurring: boolean;
}

const emptyForm = {
  name: "",
  category: BILL_CATEGORIES[0] as string,
  amount: "",
  dueDate: new Date().toISOString().slice(0, 10),
  isRecurring: true,
};

function daysUntil(dateStr: string) {
  const due = new Date(dateStr);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBills(await apiFetch<Bill[]>("/api/bills"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load bills");
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
      await apiFetch("/api/bills", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          amount: Number(form.amount),
          dueDate: new Date(form.dueDate).toISOString(),
          isRecurring: form.isRecurring,
          isPaid: false,
        }),
      });
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add bill");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(bill: Bill) {
    setTogglingId(bill.id);
    // Optimistic update — flips instantly, then confirms with the server.
    setBills((bs) => bs.map((b) => (b.id === bill.id ? { ...b, isPaid: !b.isPaid } : b)));
    try {
      await apiFetch(`/api/bills/${bill.id}`, { method: "PATCH", body: JSON.stringify({ isPaid: !bill.isPaid }) });
    } catch (err) {
      // Revert on failure so the UI never shows a state the server rejected.
      setBills((bs) => bs.map((b) => (b.id === bill.id ? { ...b, isPaid: bill.isPaid } : b)));
      setError(err instanceof ApiError ? err.message : "Failed to update bill");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/bills/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete bill");
    } finally {
      setDeletingId(null);
    }
  }

  const sorted = [...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Bills</h1>
        <Button onClick={() => setShowForm((s) => !s)}>+ Add bill</Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input
              label="Bill name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {BILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label="Amount"
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <Input
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              required
            />
            <label className="col-span-2 flex items-center gap-2 text-sm text-ink-soft dark:text-mist/70">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
              />
              Recurring monthly
            </label>
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? "Adding…" : "Add bill"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardLabel>{loading ? "Loading…" : `${bills.length} bills`}</CardLabel>
        <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
          {sorted.map((bill) => {
            const days = daysUntil(bill.dueDate);
            const overdue = days < 0 && !bill.isPaid;
            const soon = days >= 0 && days <= 5 && !bill.isPaid;
            const isBusy = deletingId === bill.id || togglingId === bill.id;
            return (
              <li key={bill.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className={cn("font-medium", bill.isPaid ? "text-ink-soft dark:text-mist/40 line-through" : "text-ink dark:text-mist")}>
                    {bill.name} <span className="font-normal text-ink-soft dark:text-mist/50">· {bill.category}</span>
                  </p>
                  <p
                    className={cn(
                      "text-ink-soft dark:text-mist/50",
                      overdue && "text-danger",
                      soon && "text-warning"
                    )}
                  >
                    {bill.isPaid
                      ? "Paid"
                      : overdue
                      ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`
                      : days === 0
                      ? "Due today"
                      : `Due in ${days} day${days === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="num font-medium text-ink dark:text-mist">
                    ₹{Math.round(bill.amount).toLocaleString("en-IN")}
                  </span>
                  <Button
                    size="sm"
                    variant={bill.isPaid ? "secondary" : "primary"}
                    onClick={() => togglePaid(bill)}
                    loading={togglingId === bill.id}
                    disabled={isBusy && togglingId !== bill.id}
                  >
                    {bill.isPaid ? "Mark unpaid" : "Mark paid"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(bill.id)}
                    loading={deletingId === bill.id}
                    disabled={isBusy && deletingId !== bill.id}
                  >
                    {deletingId === bill.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        {!loading && bills.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No bills tracked yet.</p>
        )}
      </Card>
    </div>
  );
}
