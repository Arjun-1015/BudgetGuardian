import { cn } from "@/lib/cn";
import type { RiskLevel } from "@/lib/prediction";

const CONFIG: Record<RiskLevel, { label: string; dot: string; bg: string; text: string }> = {
  safe: {
    label: "Safe",
    dot: "bg-safe",
    bg: "bg-safe/15",
    text: "text-safe",
  },
  warning: {
    label: "Warning",
    dot: "bg-warning",
    bg: "bg-warning/15",
    text: "text-warning",
  },
  danger: {
    label: "High Risk",
    dot: "bg-danger",
    bg: "bg-danger/15",
    text: "text-danger",
  },
};

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const c = CONFIG[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-pill px-3 py-1 text-sm font-medium",
        c.bg,
        c.text,
        level === "danger" && "animate-pulse",
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
