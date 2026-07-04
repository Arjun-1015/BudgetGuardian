export interface PendingExpense {
  localId: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  paymentMethod: string;
  isRecurring: boolean;
  queuedAt: string;
}

const DB_NAME = "budgetguardian-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-expenses";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB isn't available in this browser."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "localId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addPendingExpense(
  expense: Omit<PendingExpense, "localId" | "queuedAt">
): Promise<PendingExpense> {
  const db = await openDB();
  const record: PendingExpense = {
    ...expense,
    localId: crypto.randomUUID(),
    queuedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as PendingExpense[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removePendingExpense(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
