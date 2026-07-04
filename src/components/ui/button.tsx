import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and disables the button. Set this the moment an
   * async action starts (before the `await`), not after — the point is
   * instant feedback regardless of how long the request actually takes. */
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: "bg-brand text-mist hover:bg-brand-deep",
  secondary:
    "bg-white/70 dark:bg-white/10 text-ink dark:text-mist hover:bg-white/90 dark:hover:bg-white/20 border border-ink/10 dark:border-white/10",
  ghost: "bg-transparent hover:bg-ink/5 dark:hover:bg-white/10 text-ink dark:text-mist",
  danger: "bg-danger text-mist hover:opacity-90",
};

const sizeClasses: Record<string, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

const spinnerSizeClasses: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-4.5 w-4.5",
};

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <svg
      className={cn("animate-spin", spinnerSizeClasses[size])}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size={size} />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
