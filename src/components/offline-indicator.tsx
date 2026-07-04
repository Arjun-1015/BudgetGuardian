"use client";

import { useOfflineSync } from "@/lib/use-offline-sync";
import { cn } from "@/lib/cn";

export function OfflineIndicator() {
  const { isOnline, pendingCount, syncing } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-medium",
        !isOnline ? "bg-warning/15 text-warning" : "bg-brand/15 text-brand"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", !isOnline ? "bg-warning" : "bg-brand animate-pulse")} />
      {!isOnline
        ? pendingCount > 0
          ? `Offline — ${pendingCount} queued`
          : "Offline"
        : syncing
        ? `Syncing ${pendingCount}…`
        : `${pendingCount} pending`}
    </span>
  );
}
