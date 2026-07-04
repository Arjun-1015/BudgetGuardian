"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const DISMISSED_KEY = "bg_dismissed_announcements";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markDismissed(id: string) {
  const dismissed = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]));
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    apiFetch<Announcement[]>("/api/announcements")
      .then((all) => {
        const dismissed = getDismissed();
        setAnnouncements(all.filter((a) => !dismissed.includes(a.id)));
      })
      .catch(() => {});
  }, []);

  function dismiss(id: string) {
    markDismissed(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-6 pt-4">
      {announcements.map((a) => (
        <div
          key={a.id}
          className="flex items-start justify-between gap-4 rounded-card border border-brand/20 bg-brand/10 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-ink dark:text-mist">{a.title}</p>
            <p className="text-ink-soft dark:text-mist/70">{a.message}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            aria-label="Dismiss"
            className="shrink-0 text-ink-soft hover:text-ink dark:text-mist/50 dark:hover:text-mist"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
