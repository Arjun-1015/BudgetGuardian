"use client";

import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-pill transition-colors duration-300 ease-out",
        isDark ? "bg-charcoal-soft" : "bg-brand/15",
        className
      )}
    >
      <span
        className={cn(
          "absolute left-1 flex h-6 w-6 items-center justify-center rounded-full bg-mist shadow-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          isDark && "translate-x-6"
        )}
      >
        {/* Sun */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            "absolute h-3.5 w-3.5 text-warning transition-all duration-200",
            isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </g>
        </svg>
        {/* Moon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={cn(
            "absolute h-3.5 w-3.5 text-brand-deep transition-all duration-200",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
          )}
        >
          <path
            d="M21 12.5A8.5 8.5 0 1 1 11.5 3a6.5 6.5 0 0 0 9.5 9.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
    </button>
  );
}
