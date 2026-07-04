"use client";

import { useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isSuspended: boolean;
  onboardedAt: string | null;
  createdAt: string;
  _count: { expenses: number };
}

export function AdminUserTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setUsers(await apiFetch<AdminUser[]>("/api/admin/users"));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSuspend(user: AdminUser) {
    setTogglingId(user.id);
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isSuspended: !user.isSuspended }),
      });
      await load();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <Card>
      <CardLabel>{loading ? "Loading…" : `${users.length} users`}</CardLabel>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-ink-soft dark:text-mist/50">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Expenses logged</th>
              <th className="pb-2 font-medium">Onboarded</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5 dark:divide-white/10">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 text-ink dark:text-mist">
                  {u.name} {u.isAdmin && <span className="ml-1 text-xs text-brand">(admin)</span>}
                </td>
                <td className="py-3 text-ink-soft dark:text-mist/60">{u.email}</td>
                <td className="py-3 num text-ink dark:text-mist">{u._count.expenses}</td>
                <td className="py-3 text-ink-soft dark:text-mist/60">{u.onboardedAt ? "Yes" : "No"}</td>
                <td className="py-3">
                  <span className={cn("text-xs font-medium", u.isSuspended ? "text-danger" : "text-safe")}>
                    {u.isSuspended ? "Suspended" : "Active"}
                  </span>
                </td>
                <td className="py-3">
                  {!u.isAdmin && (
                    <Button
                      size="sm"
                      variant={u.isSuspended ? "secondary" : "danger"}
                      onClick={() => toggleSuspend(u)}
                      loading={togglingId === u.id}
                    >
                      {u.isSuspended ? "Unsuspend" : "Suspend"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && users.length === 0 && (
        <p className="mt-4 text-sm text-ink-soft dark:text-mist/50">No users yet.</p>
      )}
    </Card>
  );
}
