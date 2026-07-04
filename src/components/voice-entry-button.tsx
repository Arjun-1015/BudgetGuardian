"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseVoiceExpense, ExpenseDraft } from "@/lib/expense-parsing";

interface SpeechRecognitionResultLike {
  results: { 0: { transcript: string } }[];
}

export function VoiceEntryButton({ onParsed }: { onParsed: (draft: ExpenseDraft) => void }) {
  const [listening, setListening] = useState(false);
  // Starts false on both server and client so the first render matches
  // (no `window` on the server). Flipped after mount, client-only.
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  function start() {
    setError(null);
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Voice input isn't supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => {
      setListening(false);
      setError("Couldn't hear that — try again or type it manually.");
    };
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionResultLike) => {
      const transcript = event.results[0][0].transcript;
      onParsed(parseVoiceExpense(transcript));
    };

    recognition.start();
  }

  if (!supported) return null;

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="secondary" size="sm" onClick={start} disabled={listening}>
        {listening ? "Listening…" : "🎤 Speak an expense"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
