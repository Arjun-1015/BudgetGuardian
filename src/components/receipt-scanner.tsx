"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseReceiptText, ExpenseDraft } from "@/lib/expense-parsing";

export function ReceiptScanner({ onParsed }: { onParsed: (draft: ExpenseDraft) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanning(true);
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const result = await Tesseract.recognize(file, "eng");
      onParsed(parseReceiptText(result.data.text));
    } catch {
      setError("Couldn't read that receipt — try a clearer photo or enter it manually.");
    } finally {
      setScanning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <Button type="button" variant="secondary" size="sm" disabled={scanning} onClick={() => inputRef.current?.click()}>
        {scanning ? "Scanning receipt…" : "📷 Scan receipt"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
