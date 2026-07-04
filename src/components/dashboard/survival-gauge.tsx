"use client";

import type { RiskLevel } from "@/lib/prediction";

interface SurvivalGaugeProps {
  dailyBudget: number;
  riskLevel: RiskLevel;
  currencySymbol: string;
}

const RISK_ANGLE: Record<RiskLevel, number> = {
  danger: -70,
  warning: 0,
  safe: 70,
};

const RISK_COLOR: Record<RiskLevel, string> = {
  danger: "#C25B4E",
  warning: "#D9A15B",
  safe: "#6FA787",
};

// Polar -> cartesian helper for building the arc path.
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function SurvivalGauge({ dailyBudget, riskLevel, currencySymbol }: SurvivalGaugeProps) {
  const cx = 110;
  const cy = 110;
  const r = 88;
  const needleAngle = RISK_ANGLE[riskLevel];

  const needleEnd = polarToCartesian(cx, cy, r - 20, needleAngle);
  const displayAmount = Math.round(dailyBudget).toLocaleString("en-IN");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 140" className="w-full max-w-[220px]" role="img" aria-label={`Safe daily budget ${currencySymbol}${displayAmount}, risk level ${riskLevel}`}>
        {/* Track segments: danger / warning / safe, left to right */}
        <path d={describeArc(cx, cy, r, -90, -30)} stroke="#C25B4E" strokeWidth="14" fill="none" strokeLinecap="round" opacity={0.85} />
        <path d={describeArc(cx, cy, r, -30, 30)} stroke="#D9A15B" strokeWidth="14" fill="none" strokeLinecap="round" opacity={0.85} />
        <path d={describeArc(cx, cy, r, 30, 90)} stroke="#6FA787" strokeWidth="14" fill="none" strokeLinecap="round" opacity={0.85} />

        {/* Needle */}
        <g style={{ transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
          <line
            x1={cx}
            y1={cy}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={RISK_COLOR[riskLevel]}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="7" fill={RISK_COLOR[riskLevel]} />
        </g>
      </svg>

      <div className="-mt-2 text-center">
        <p className="text-xs uppercase tracking-wide text-ink-soft/70 dark:text-mist/50 font-medium">
          Safe to spend
        </p>
        <p className="num text-3xl font-semibold" style={{ color: RISK_COLOR[riskLevel] }}>
          {currencySymbol}
          {displayAmount}
          <span className="text-base font-normal text-ink-soft dark:text-mist/60">/day</span>
        </p>
      </div>
    </div>
  );
}
