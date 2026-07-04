import { EXPENSE_CATEGORIES } from "./constants";

export interface ExpenseDraft {
  amount?: number;
  category?: string;
  date?: string; // YYYY-MM-DD
  notes?: string;
}

// Keyword -> category mapping for guessing a category from free text.
const CATEGORY_KEYWORDS: Record<string, (typeof EXPENSE_CATEGORIES)[number]> = {
  grocery: "Food",
  groceries: "Food",
  food: "Food",
  restaurant: "Food",
  lunch: "Food",
  dinner: "Food",
  coffee: "Food",
  rent: "Rent",
  uber: "Travel",
  cab: "Travel",
  taxi: "Travel",
  flight: "Travel",
  train: "Travel",
  fuel: "Fuel",
  petrol: "Fuel",
  gas: "Fuel",
  diesel: "Fuel",
  shopping: "Shopping",
  clothes: "Shopping",
  amazon: "Shopping",
  medicine: "Medicine",
  pharmacy: "Medicine",
  doctor: "Medicine",
  hospital: "Medicine",
  school: "Education",
  course: "Education",
  tuition: "Education",
  electricity: "Bills",
  water: "Bills",
  internet: "Bills",
  bill: "Bills",
  movie: "Entertainment",
  netflix: "Subscriptions",
  spotify: "Subscriptions",
  subscription: "Subscriptions",
  emi: "EMI",
  loan: "EMI",
  insurance: "Insurance",
  investment: "Investment",
  mutual: "Investment",
};

/** Parses spoken/typed text like "I spent 250 on groceries" or
 * "Spent ₹1200 on fuel yesterday" into a draft expense. Best-effort —
 * always leaves the form editable rather than silently guessing wrong. */
export function parseVoiceExpense(text: string): ExpenseDraft {
  const draft: ExpenseDraft = {};

  const amountMatch = text.match(/(?:₹|rs\.?|inr)?\s?(\d+(?:[.,]\d+)?)/i);
  if (amountMatch) draft.amount = parseFloat(amountMatch[1].replace(",", ""));

  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      draft.category = category;
      break;
    }
  }

  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    draft.date = d.toISOString().slice(0, 10);
  } else if (lower.includes("today")) {
    draft.date = new Date().toISOString().slice(0, 10);
  }

  draft.notes = text;
  return draft;
}

/** Extracts amount, date, and a merchant guess from raw OCR text off a
 * receipt. Regex-based on purpose — real receipts vary too much for
 * anything more than best-effort extraction, so the form stays editable. */
export function parseReceiptText(ocrText: string): ExpenseDraft {
  const draft: ExpenseDraft = {};

  // Look for the largest currency-like number — usually the total.
  const amounts = Array.from(ocrText.matchAll(/(?:₹|rs\.?|inr|\$)?\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{2})?)/gi))
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => !Number.isNaN(n) && n > 0);
  if (amounts.length > 0) draft.amount = Math.max(...amounts);

  const dateMatch = ocrText.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = y.length === 2 ? `20${y}` : y;
    draft.date = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const lower = ocrText.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      draft.category = category;
      break;
    }
  }

  const firstLine = ocrText.split("\n").map((l) => l.trim()).find((l) => l.length > 2);
  if (firstLine) draft.notes = `Receipt: ${firstLine}`;

  return draft;
}
