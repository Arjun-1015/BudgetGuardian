"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PRIORITY_LEVELS } from "@/lib/constants";
import { apiFetch, ApiError } from "@/lib/api-client";

interface Dependent {
  id: string;
  name: string;
  relation: string;
  age: number | null;
  monthlyExpense: number;
  priorityLevel: string;
  medicalNeeds: boolean;
}

const emptyForm = {
  name: "",
  relation: "",
  age: "",
  monthlyExpense: "",
  priorityLevel: "medium",
  medicalNeeds: false,
};

export default function DependentsPage() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
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
      const data = await apiFetch<Dependent[]>("/api/dependents");
      setDependents(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load family members");
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

  function openEdit(dep: Dependent) {
    setForm({
      name: dep.name,
      relation: dep.relation,
      age: dep.age ? String(dep.age) : "",
      monthlyExpense: String(dep.monthlyExpense),
      priorityLevel: dep.priorityLevel,
      medicalNeeds: dep.medicalNeeds,
    });
    setEditingId(dep.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const payload = {
      name: form.name,
      relation: form.relation,
      age: form.age ? Number(form.age) : undefined,
      monthlyExpense: Number(form.monthlyExpense) || 0,
      priorityLevel: form.priorityLevel,
      medicalNeeds: form.medicalNeeds,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/dependents/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/api/dependents", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save family member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this family member?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/dependents/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove family member");
    } finally {
      setDeletingId(null);
    }
  }

  const totalFamilyExpense = dependents.reduce((sum, d) => sum + d.monthlyExpense, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink dark:text-mist">Family &amp; dependents</h1>
        <Button onClick={openNew}>+ Add dependent</Button>
      </div>

      <Card className="flex flex-col gap-1">
        <CardLabel>Total household expense</CardLabel>
        <p className="num text-2xl font-semibold text-ink dark:text-mist">
          ₹{Math.round(totalFamilyExpense).toLocaleString("en-IN")}/mo
        </p>
        <p className="text-xs text-ink-soft dark:text-mist/50">
          Factored into your survival prediction on the dashboard.
        </p>
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              label="Relation"
              value={form.relation}
              onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
              required
            />
            <Input
              label="Age (optional)"
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
            <Input
              label="Monthly expense"
              type="number"
              min="0"
              value={form.monthlyExpense}
              onChange={(e) => setForm((f) => ({ ...f, monthlyExpense: e.target.value }))}
              required
            />
            <Select
              label="Priority"
              value={form.priorityLevel}
              onChange={(e) => setForm((f) => ({ ...f, priorityLevel: e.target.value }))}
            >
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 self-end text-sm text-ink-soft dark:text-mist/70">
              <input
                type="checkbox"
                checked={form.medicalNeeds}
                onChange={(e) => setForm((f) => ({ ...f, medicalNeeds: e.target.checked }))}
              />
              Has medical needs
            </label>
            {error && <p className="col-span-2 text-sm text-danger">{error}</p>}
            <div className="col-span-2 flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? (editingId ? "Saving…" : "Adding…") : editingId ? "Save changes" : "Add dependent"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardLabel>{loading ? "Loading…" : `${dependents.length} dependents`}</CardLabel>
        <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
          {dependents.map((dep) => (
            <li key={dep.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <p className="font-medium text-ink dark:text-mist">
                  {dep.name} <span className="font-normal text-ink-soft dark:text-mist/50">· {dep.relation}</span>
                </p>
                <p className="text-ink-soft dark:text-mist/50">
                  {dep.age ? `${dep.age} yrs · ` : ""}
                  {dep.priorityLevel} priority
                  {dep.medicalNeeds ? " · medical needs" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="num font-medium text-ink dark:text-mist">
                  ₹{Math.round(dep.monthlyExpense).toLocaleString("en-IN")}/mo
                </span>
                <Button size="sm" variant="ghost" onClick={() => openEdit(dep)} disabled={deletingId === dep.id}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(dep.id)}
                  loading={deletingId === dep.id}
                >
                  {deletingId === dep.id ? "Removing…" : "Remove"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {!loading && dependents.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">
            No dependents added. Your survival prediction is based on just your own expenses.
          </p>
        )}
      </Card>
    </div>
  );
}
