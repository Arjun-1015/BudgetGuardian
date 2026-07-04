export interface CategoryWeek {
  category: string;
  thisWeek: number;
  lastWeek: number;
}

export interface Insight {
  id: string;
  text: string;
}

/** Compares this week's category spend to last week's and generates
 * plain-language insights for the biggest movers. Pure function — no
 * network or DB calls — so it works even without an AI API key. */
export function buildRuleBasedInsights(categories: CategoryWeek[], dailyBudget: number, currencySymbol: string): Insight[] {
  const insights: Insight[] = [];

  const movers = categories
    .filter((c) => c.lastWeek > 0)
    .map((c) => ({ ...c, pctChange: ((c.thisWeek - c.lastWeek) / c.lastWeek) * 100 }))
    .filter((c) => Math.abs(c.pctChange) >= 15)
    .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
    .slice(0, 3);

  for (const m of movers) {
    const direction = m.pctChange > 0 ? "more" : "less";
    insights.push({
      id: `trend-${m.category}`,
      text: `You spent ${Math.round(Math.abs(m.pctChange))}% ${direction} on ${m.category.toLowerCase()} this week than last.`,
    });
  }

  const biggestThisWeek = [...categories].sort((a, b) => b.thisWeek - a.thisWeek)[0];
  if (biggestThisWeek && biggestThisWeek.thisWeek > 0) {
    insights.push({
      id: "biggest-category",
      text: `${biggestThisWeek.category} is your biggest spend this week — consider trimming it if you're feeling tight.`,
    });
  }

  insights.push({
    id: "safe-daily",
    text: `You can safely spend about ${currencySymbol}${Math.round(dailyBudget).toLocaleString("en-IN")}/day until your next salary.`,
  });

  return insights;
}

function buildPrompt(insights: Insight[]): string {
  return `You are a friendly budget coach. In 2-3 short sentences, summarize these spending facts for the user in an encouraging but honest tone. Facts:\n${insights
    .map((i) => `- ${i.text}`)
    .join("\n")}`;
}

async function summarizeWithAnthropic(apiKey: string, insights: Insight[]): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [{ role: "user", content: buildPrompt(insights) }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[advisor] Anthropic API error ${res.status}: ${body}`);
    return null;
  }
  const data = await res.json();
  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text;
  return typeof text === "string" ? text : null;
}

// gemini-2.0-flash was discontinued by Google on 2026-06-01. Kept as a
// documented default so this doesn't silently rot again — override with
// GEMINI_MODEL if Google renames/deprecates this one too. Check
// https://ai.google.dev/gemini-api/docs/models for the current list.
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

async function summarizeWithGemini(apiKey: string, insights: Insight[]): Promise<string | null> {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(insights) }] }],
        generationConfig: {
          maxOutputTokens: 500,
          // Gemini 2.5+ models "think" before answering by default, and
          // thinking tokens count against maxOutputTokens — for a short
          // summarization task like this that was silently eating the
          // whole budget and truncating the visible reply mid-sentence.
          // This task doesn't need reasoning, so turn it off.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[advisor] Gemini API error ${res.status} (model: ${model}): ${body}`);
    return null;
  }
  const data = await res.json();
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") {
    console.error("[advisor] Gemini response was truncated (hit MAX_TOKENS) — increase maxOutputTokens.");
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    // Common cause: the response was blocked by safety filters and has
    // no candidates/parts at all — log the raw shape so it's diagnosable.
    console.error("[advisor] Gemini response had no usable text:", JSON.stringify(data));
    return null;
  }
  return text.trim();
}

/** Optional: turns the rule-based insights into a short natural-language
 * paragraph using whichever AI provider is configured. Checks
 * GEMINI_API_KEY first, then ANTHROPIC_API_KEY, so you only need to set
 * one. Falls back to null (caller just shows the rule-based list) when no
 * key is set or the call fails — the feature works out of the box with
 * zero external dependencies, with an upgrade path either way. Failures
 * are logged to the server console (not swallowed silently) so issues
 * like a renamed/deprecated model are actually diagnosable. */
export async function generateAiSummary(insights: Insight[]): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  try {
    if (geminiKey) return await summarizeWithGemini(geminiKey, insights);
    if (anthropicKey) return await summarizeWithAnthropic(anthropicKey, insights);
    return null;
  } catch (err) {
    console.error("[advisor] AI summary request threw:", err);
    return null;
  }
}
