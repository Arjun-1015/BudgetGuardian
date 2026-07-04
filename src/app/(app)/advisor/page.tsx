"use client";

import { useEffect, useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface AdvisorResponse {
  insights: { id: string; text: string }[];
  aiSummary: string | null;
}

export default function AdvisorPage() {
  const [data, setData] = useState<AdvisorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<AdvisorResponse>("/api/advisor")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink dark:text-mist">Budget advisor</h1>
      <p className="-mt-4 text-sm text-ink-soft dark:text-mist/60">
        Insights are computed from your real spending — no guesswork.
      </p>

      {loading && <p className="text-sm text-ink-soft dark:text-mist/50">Analyzing your spending…</p>}

      {data?.aiSummary && (
        <Card className="border-brand/30 bg-brand/5">
          <CardLabel>AI summary</CardLabel>
          <p className="mt-2 text-sm text-ink dark:text-mist">{data.aiSummary}</p>
        </Card>
      )}

      <Card>
        <CardLabel>What we noticed</CardLabel>
        <ul className="mt-4 flex flex-col gap-3">
          {data?.insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-3 text-sm text-ink dark:text-mist">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {insight.text}
            </li>
          ))}
        </ul>
        {data && data.insights.length === 0 && (
          <p className="mt-2 text-sm text-ink-soft dark:text-mist/50">
            Log a few more expenses to unlock personalized insights.
          </p>
        )}
      </Card>

      {!data?.aiSummary && !loading && (
        <p className="text-xs text-ink-soft dark:text-mist/40">
          Tip: set GEMINI_API_KEY or ANTHROPIC_API_KEY in your environment to also get a natural-language AI summary here.
        </p>
      )}
    </div>
  );
}
