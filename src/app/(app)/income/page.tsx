"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INCOME_SOURCES } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";

interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  date: string;
  notes: string | null;
}

const emptyForm = {
  source: INCOME_SOURCES[0] as string,
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function IncomePage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<IncomeEntry[]>("/api/income");
      setEntries(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load income");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(entry: IncomeEntry) {
    setForm({
      source: entry.source,
      amount: String(entry.amount),
      date: entry.date.slice(0, 10),
      notes: entry.notes ?? "",
    });
    setEditingId(entry.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      source: form.source,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/income/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/income", { method: "POST", body: JSON.stringify(payload) });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save income");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this income entry?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/income/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete income");
    } finally {
      setDeletingId(null);
    }
  }

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Income</h1>
        <Button onClick={openNew}>+ Add income</Button>
      </div>

      <Card className="flex flex-col gap-1">
        <CardLabel>Total logged income</CardLabel>
        <p className="num text-2xl font-semibold text-safe">₹{Math.round(total).toLocaleString("en-IN")}</p>
        <p className="text-xs text-ink-soft dark:text-mist/50">
          Plus your recurring monthly salary, set in onboarding/settings.
        </p>
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Select
              label="Source"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            >
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input
              label="Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
            <Input
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save changes" : "Add income"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardLabel>{loading ? "Loading…" : `${entries.length} entries`}</CardLabel>
        <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium capitalize text-ink dark:text-mist">{entry.source}</p>
                <p className="truncate text-ink-soft dark:text-mist/50">
                  {new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {entry.notes ? ` · ${entry.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="num font-medium text-safe">
                  +₹{Math.round(entry.amount).toLocaleString("en-IN")}
                </span>
                <Button size="sm" variant="ghost" onClick={() => openEdit(entry)} disabled={deletingId === entry.id}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(entry.id)}
                  loading={deletingId === entry.id}
                >
                  {deletingId === entry.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {!loading && entries.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No extra income logged yet.</p>
        )}
      </Card>
    </div>
  );
}
