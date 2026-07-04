"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";
import { VoiceEntryButton } from "@/components/voice-entry-button";
import { ReceiptScanner } from "@/components/receipt-scanner";
import type { ExpenseDraft } from "@/lib/expense-parsing";
import { addPendingExpense, getPendingExpenses, removePendingExpense } from "@/lib/offline-queue";
import { useOfflineSync } from "@/lib/use-offline-sync";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
  paymentMethod: string;
  isRecurring: boolean;
}

// A row in the displayed list — either a real synced expense, or one
// still sitting in the offline queue waiting to reach the server.
interface DisplayExpense extends Expense {
  pending: boolean;
  localId?: string;
}

const emptyForm = {
  amount: "",
  category: EXPENSE_CATEGORIES[0] as string,
  date: new Date().toISOString().slice(0, 10),
  notes: "",
  paymentMethod: "card",
  isRecurring: false,
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<DisplayExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { isOnline, pendingCount, refreshPendingCount } = useOfflineSync();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (categoryFilter) params.set("category", categoryFilter);
      const [serverExpenses, pending] = await Promise.all([
        apiFetch<Expense[]>(`/api/expenses?${params.toString()}`),
        getPendingExpenses().catch(() => []),
      ]);
      // Pending items always show regardless of the search/category filter
      // above — they're rare and the point is visibility that they exist,
      // not filtering them like already-synced data.
      const pendingDisplay: DisplayExpense[] = pending.map((p) => ({
        id: `pending-${p.localId}`,
        localId: p.localId,
        amount: p.amount,
        category: p.category,
        date: p.date,
        notes: p.notes ?? null,
        paymentMethod: p.paymentMethod,
        isRecurring: p.isRecurring,
        pending: true,
      }));
      const synced: DisplayExpense[] = serverExpenses.map((e) => ({ ...e, pending: false }));
      setExpenses([...pendingDisplay, ...synced]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Whenever the shared offline-sync hook reports the pending count
  // changed (e.g. it just flushed some items to the server), refresh the
  // list so synced items move from "pending" to normal.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCount]);

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(expense: Expense) {
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      date: expense.date.slice(0, 10),
      notes: expense.notes ?? "",
      paymentMethod: expense.paymentMethod,
      isRecurring: expense.isRecurring,
    });
    setEditingId(expense.id);
    setShowForm(true);
  }

  function duplicate(expense: Expense) {
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      date: new Date().toISOString().slice(0, 10),
      notes: expense.notes ?? "",
      paymentMethod: expense.paymentMethod,
      isRecurring: expense.isRecurring,
    });
    setEditingId(null);
    setShowForm(true);
  }

  function applyDraft(draft: ExpenseDraft) {
    setForm((f) => ({
      ...f,
      amount: draft.amount !== undefined ? String(draft.amount) : f.amount,
      category: draft.category ?? f.category,
      date: draft.date ?? f.date,
      notes: draft.notes ?? f.notes,
    }));
    setEditingId(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      amount: Number(form.amount),
      category: form.category,
      date: new Date(form.date).toISOString(),
      notes: form.notes || undefined,
      paymentMethod: form.paymentMethod,
      isRecurring: form.isRecurring,
    };
    try {
      if (editingId) {
        // Editing an already-synced expense needs a live connection —
        // offline support here is scoped to creating new expenses, per
        // the original spec ("users can continue entering expenses").
        await apiFetch(`/api/expenses/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else if (!navigator.onLine) {
        await addPendingExpense(payload);
        await refreshPendingCount();
      } else {
        try {
          await apiFetch("/api/expenses", { method: "POST", body: JSON.stringify(payload) });
        } catch (err) {
          // Distinguish "server rejected it" (ApiError, e.g. bad input —
          // surface it, queuing would just fail again identically) from
          // "the request never reached the server" (flaky connection —
          // fall back to the offline queue so nothing gets lost).
          if (err instanceof ApiError) throw err;
          await addPendingExpense(payload);
          await refreshPendingCount();
        }
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }

  async function removeFromQueue(localId: string) {
    if (!confirm("Discard this unsynced expense? It was never saved to the server.")) return;
    await removePendingExpense(localId);
    await refreshPendingCount();
    await load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Expenses</h1>
        <div className="flex items-center gap-2">
          <VoiceEntryButton onParsed={applyDraft} />
          <ReceiptScanner onParsed={applyDraft} />
          <Button onClick={openNew}>+ Add expense</Button>
        </div>
      </div>

      {!isOnline && (
        <div className="rounded-card border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          You&apos;re offline. New expenses you add will be saved on this device and synced automatically once
          you&apos;re back online.
        </div>
      )}

      <Card className="flex flex-wrap gap-4">
        <Input
          placeholder="Search notes, category, payment method…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1"
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            <Select
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace("_", " ")}
                </option>
              ))}
            </Select>
            <Input
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="col-span-2"
            />
            <label className="col-span-2 flex items-center gap-2 text-sm text-ink-soft dark:text-mist/70">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
              />
              This is a recurring expense
            </label>
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save changes" : "Add expense"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardLabel>
          {loading ? "Loading…" : `${expenses.length} expenses`}
          {pendingCount > 0 && ` · ${pendingCount} waiting to sync`}
        </CardLabel>
        <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-ink dark:text-mist">
                  {expense.category}
                  {expense.pending && (
                    <span className="rounded-pill bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                      Pending sync
                    </span>
                  )}
                </p>
                <p className="truncate text-ink-soft dark:text-mist/50">
                  {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {expense.paymentMethod.replace("_", " ")}
                  {expense.notes ? ` · ${expense.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="num font-medium text-ink dark:text-mist">
                  -{Math.round(expense.amount).toLocaleString("en-IN")}
                </span>
                {expense.pending ? (
                  <Button size="sm" variant="ghost" onClick={() => removeFromQueue(expense.localId!)}>
                    Discard
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => duplicate(expense)} disabled={deletingId === expense.id}>
                      Duplicate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(expense)} disabled={deletingId === expense.id}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(expense.id)}
                      loading={deletingId === expense.id}
                    >
                      {deletingId === expense.id ? "Deleting…" : "Delete"}
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
        {!loading && expenses.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No expenses match your filters.</p>
        )}
      </Card>
    </div>
  );
}
