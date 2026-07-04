import { Card, CardLabel } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  amount: number;
  currencySymbol: string;
  tone?: "default" | "positive" | "negative";
  className?: string;
}

export function StatCard({ label, amount, currencySymbol, tone = "default", className }: StatCardProps) {
  const toneClass =
    tone === "positive" ? "text-safe" : tone === "negative" ? "text-danger" : "text-ink dark:text-mist";
  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <CardLabel>{label}</CardLabel>
      <p className={cn("num text-2xl font-semibold", toneClass)}>
        {currencySymbol}
        {Math.round(amount).toLocaleString("en-IN")}
      </p>
    </Card>
  );
}
