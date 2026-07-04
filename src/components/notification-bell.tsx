"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/cn";

interface AppNotification {
  id: string;
  severity: "info" | "warning" | "danger";
  message: string;
}

const DOT: Record<AppNotification["severity"], string> = {
  info: "bg-brand",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<AppNotification[]>("/api/notifications").then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-ink-soft hover:bg-ink/5 dark:text-mist/70 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-card border border-ink/10 bg-mist p-2 shadow-glass dark:border-white/10 dark:bg-charcoal-soft">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-ink-soft dark:text-mist/50">You&apos;re all caught up.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-2 rounded-xl p-3 text-sm hover:bg-ink/5 dark:hover:bg-white/5">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOT[n.severity])} />
                  <span className="text-ink dark:text-mist">{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
