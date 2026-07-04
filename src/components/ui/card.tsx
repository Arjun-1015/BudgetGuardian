import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-card p-6", className)} {...props} />;
}

export function CardLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs uppercase tracking-wide text-ink-soft/70 dark:text-mist/50 font-medium", className)}
      {...props}
    />
  );
}
