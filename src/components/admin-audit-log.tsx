"use client";

import { useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface AuditEntry {
  id: string;
  adminName: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "user.suspend": "suspended user",
  "user.unsuspend": "unsuspended user",
  "announcement.create": "published announcement",
  "announcement.activate": "reactivated announcement",
  "announcement.deactivate": "deactivated announcement",
  "announcement.delete": "deleted announcement",
};

export function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AuditEntry[]>("/api/admin/audit-log")
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardLabel>{loading ? "Loading…" : `${entries.length} recent actions`}</CardLabel>
      <ul className="mt-4 divide-y divide-ink/5 dark:divide-white/10">
        {entries.map((e) => (
          <li key={e.id} className="py-3 text-sm">
            <p className="text-ink dark:text-mist">
              <span className="font-medium">{e.adminName}</span>{" "}
              {ACTION_LABELS[e.action] ?? e.action}
              {e.details ? <span className="text-ink-soft dark:text-mist/60"> — {e.details}</span> : null}
            </p>
            <p className="text-xs text-ink-soft/70 dark:text-mist/40">
              {new Date(e.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </li>
        ))}
      </ul>
      {!loading && entries.length === 0 && (
        <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No admin activity yet.</p>
      )}
    </Card>
  );
}
