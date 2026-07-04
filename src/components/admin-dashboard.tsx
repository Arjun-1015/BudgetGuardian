"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AdminUserTable } from "@/components/admin-user-table";
import { AdminAnalytics } from "@/components/admin-analytics";
import { AdminAnnouncementsPanel } from "@/components/admin-announcements-panel";
import { AdminAuditLog } from "@/components/admin-audit-log";

const TABS = [
  { id: "users", label: "Users" },
  { id: "analytics", label: "Analytics" },
  { id: "announcements", label: "Announcements" },
  { id: "activity", label: "Activity log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("users");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-pill px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-brand text-mist"
                : "bg-white/60 dark:bg-white/5 text-ink-soft dark:text-mist/70 hover:bg-white/90 dark:hover:bg-white/10"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <AdminUserTable />}
      {tab === "analytics" && <AdminAnalytics />}
      {tab === "announcements" && <AdminAnnouncementsPanel />}
      {tab === "activity" && <AdminAuditLog />}
    </div>
  );
}
