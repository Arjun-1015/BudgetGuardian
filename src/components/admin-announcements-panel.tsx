"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface Announcement {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdByName: string;
  createdAt: string;
}

export function AdminAnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnnouncements(await apiFetch<Announcement[]>("/api/admin/announcements"));
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
      await apiFetch("/api/admin/announcements", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", message: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create announcement");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Announcement) {
    setTogglingId(a.id);
    try {
      await apiFetch(`/api/admin/announcements/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement permanently?")) return;
    setDeletingId(id);
    try {
      await apiFetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft dark:text-mist/60">
          Active announcements show as a dismissible banner to every signed-in user.
        </p>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          + New announcement
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft dark:text-mist/80">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={3}
                required
                className="rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-4 py-2.5 text-ink dark:text-mist outline-none focus:border-brand transition-colors"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                {saving ? "Publishing…" : "Publish"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardLabel>{loading ? "Loading…" : `${announcements.length} announcements`}</CardLabel>
        <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className={cn("font-medium", a.isActive ? "text-ink dark:text-mist" : "text-ink-soft dark:text-mist/40")}>
                  {a.title}
                </p>
                <p className="text-ink-soft dark:text-mist/50">{a.message}</p>
                <p className="mt-1 text-xs text-ink-soft/70 dark:text-mist/30">
                  {a.createdByName} · {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant={a.isActive ? "secondary" : "primary"}
                  onClick={() => toggleActive(a)}
                  loading={togglingId === a.id}
                >
                  {a.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} loading={deletingId === a.id}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {!loading && announcements.length === 0 && (
          <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No announcements yet.</p>
        )}
      </Card>
    </div>
  );
}
