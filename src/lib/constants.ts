// Kept separate from lib/auth.ts so middleware (which runs on the Edge
// runtime) can import just the cookie name without pulling in bcryptjs /
// next/headers, neither of which are Edge-compatible.
export const SESSION_COOKIE = "bg_session";

export const EXPENSE_CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Fuel",
  "Shopping",
  "Medicine",
  "Education",
  "Bills",
  "Entertainment",
  "Investment",
  "EMI",
  "Subscriptions",
  "Insurance",
  "Others",
] as const;

export const INCOME_SOURCES = [
  "salary",
  "freelance",
  "business",
  "rental",
  "interest",
  "bonus",
  "refund",
  "other",
] as const;

export const PAYMENT_METHODS = ["cash", "card", "upi", "bank_transfer", "other"] as const;

export const PRIORITY_LEVELS = ["low", "medium", "high"] as const;

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "CAD", "AUD"] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  CAD: "$",
  AUD: "$",
};

export const BILL_CATEGORIES = [
  "Electricity",
  "Internet",
  "Gas",
  "Water",
  "Rent",
  "EMI",
  "Insurance",
  "Subscriptions",
  "Other",
] as const;
