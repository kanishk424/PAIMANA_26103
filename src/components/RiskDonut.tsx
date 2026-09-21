import { useId, useState, type CSSProperties } from "react";
import { useInView } from "../hooks/usePageMotion";

export type RiskDistribution = {
  high: number;
  medium: number;
  low: number;
};

const segmentMeta = [
  { key: "high" as const, label: "High Risk", color: "#dc2626", light: "#f4a6a6" },
  { key: "medium" as const, label: "Medium Risk", color: "#f59e0b", light: "#fbd58a" },
  { key: "low" as const, label: "Low Risk", color: "#16a34a", light: "#86dda2" },
];

export function RiskDonut({ data, total, centerLabel = "Total Projects" }: { data: RiskDistribution; total?: number; centerLabel?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const [hovered, setHovered] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");
  const computedTotal = total ?? data.high + data.medium + data.low;
  let offset = 0;

  const segments = segmentMeta.map((meta, index) => {
    const count = data[meta.key];
    const percentage = computedTotal > 0 ? (count / computedTotal) * 100 : 0;
    const start = offset;
    offset += percentage;
    const middleAngle = ((start + percentage / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    const pull = hovered === index ? 5 : 0;
    return {
      ...meta,
      count,
      percentage,
      start,
      visibleArc: Math.max(0, percentage - 1.25),
      pullX: Math.cos(middleAngle) * pull,
      pullY: Math.sin(middleAngle) * pull,
    };
  });

  const active = hovered == null ? null : segments[hovered];

  return (
    <div ref={ref} className={`risk-donut ${inView ? "is-live" : ""}`}>
      <div className="risk-donut-visual">
        <svg viewBox="0 0 220 220" role="img" aria-label={`Risk distribution: ${data.high} high, ${data.medium} medium, ${data.low} low`}>
          <defs>
            {segments.map((segment) => (
              <linearGradient key={segment.key} id={`${gradientId}-${segment.key}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={segment.light} />
                <stop offset="45%" stopColor={segment.color} />
                <stop offset="100%" stopColor={segment.color} stopOpacity="0.88" />
              </linearGradient>
            ))}
            <filter id={`${gradientId}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2b2130" floodOpacity="0.1" />
            </filter>
          </defs>
          <circle className="risk-donut-track" cx="110" cy="110" r="76" />
          {segments.map((segment, index) => (
            <g
              key={segment.key}
              className={`risk-donut-segment-wrap ${hovered === index ? "is-hovered" : ""}`}
              style={{ transform: `translate(${segment.pullX}px, ${segment.pullY}px)` }}
            >
              <circle
                className="risk-donut-segment"
                cx="110"
                cy="110"
                r="76"
                pathLength="100"
                fill="none"
                stroke={`url(#${gradientId}-${segment.key})`}
                strokeDasharray={inView ? `${segment.visibleArc} ${100 - segment.visibleArc}` : "0 100"}
                strokeDashoffset={-segment.start}
                transform="rotate(-90 110 110)"
                filter={`url(#${gradientId}-shadow)`}
                style={{ "--segment-delay": `${index * 90}ms` } as CSSProperties}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`${segment.label}: ${segment.count}, ${segment.percentage.toFixed(1)} percent`}
              />
            </g>
          ))}
          <circle className="risk-donut-inner" cx="110" cy="110" r="55" />
        </svg>
        <div className="risk-donut-center" aria-hidden="true">
          <strong>{computedTotal.toLocaleString("en-IN")}</strong>
          <span>{centerLabel}</span>
        </div>
        {active && (
          <div className="risk-donut-tooltip" role="status">
            <span><i style={{ background: active.color }} />{active.label}</span>
            <strong>{active.count.toLocaleString("en-IN")}</strong>
            <small>{active.percentage.toFixed(1)}%</small>
          </div>
        )}
      </div>
      <div className="risk-donut-legend">
        {segments.map((segment) => (
          <div key={segment.key}>
            <i style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.count.toLocaleString("en-IN")}</strong>
            <small>{segment.percentage.toFixed(1)}%</small>
          </div>
        ))}
      </div>
    </div>
  );
}