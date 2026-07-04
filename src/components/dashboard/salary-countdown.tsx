"use client";

interface SalaryCountdownProps {
  daysLeft: number;
  cycleLength: number; // total days in the current pay cycle, for the ring fraction
}

export function SalaryCountdown({ daysLeft, cycleLength }: SalaryCountdownProps) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const fractionElapsed = Math.min(Math.max(1 - daysLeft / Math.max(cycleLength, 1), 0), 1);
  const offset = circumference * (1 - fractionElapsed);

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r={r} strokeWidth="10" className="stroke-ink/10 dark:stroke-white/10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          strokeWidth="10"
          fill="none"
          stroke="#3F6E67"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="num text-3xl font-semibold text-ink dark:text-mist">{daysLeft}</span>
        <span className="text-xs text-ink-soft dark:text-mist/60">
          {daysLeft === 1 ? "day left" : "days left"}
        </span>
      </div>
    </div>
  );
}
