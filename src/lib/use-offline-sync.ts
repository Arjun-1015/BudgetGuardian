import { useCallback, useEffect, useState } from "react";
import { getPendingExpenses, removePendingExpense, PendingExpense } from "./offline-queue";
import { apiFetch } from "./api-client";

// Shared across every component using this hook, so if both the NavBar
// indicator and the Expenses page are mounted at once, only one of them
// actually performs the flush instead of racing each other.
let isFlushing = false;
const listeners = new Set<() => void>();

function notifyPendingChanged() {
  listeners.forEach((fn) => fn());
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await getPendingExpenses();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB unavailable (e.g. private browsing in some browsers) —
      // offline queueing just won't be available, not a fatal error.
    }
  }, []);

  const flush = useCallback(async () => {
    if (isFlushing || !navigator.onLine) return;
    isFlushing = true;
    setSyncing(true);
    try {
      const pending = await getPendingExpenses();
      for (const item of pending) {
        try {
          await syncOne(item);
          await removePendingExpense(item.localId);
        } catch {
          // Stop at the first failure (likely means we went back offline
          // mid-sync) rather than burning through retries for every item.
          break;
        }
      }
    } finally {
      isFlushing = false;
      setSyncing(false);
      await refreshPendingCount();
      notifyPendingChanged();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPendingCount();

    function handleOnline() {
      setIsOnline(true);
      flush();
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    listeners.add(refreshPendingCount);

    // Catch up on anything queued from a previous session.
    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      listeners.delete(refreshPendingCount);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, syncing, flush, refreshPendingCount };
}

async function syncOne(item: PendingExpense) {
  await apiFetch("/api/expenses", {
    method: "POST",
    body: JSON.stringify({
      amount: item.amount,
      category: item.category,
      date: item.date,
      notes: item.notes,
      paymentMethod: item.paymentMethod,
      isRecurring: item.isRecurring,
    }),
  });
}
