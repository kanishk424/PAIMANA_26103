import { useEffect, useId, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { RiskDonut } from "../components/RiskDonut";
import {
  COST_ESCALATION_DRIVERS,
  MINISTRY_STATS,
  SECTOR_AVG_SCORES,
  SECTOR_DISTRIBUTION,
} from "../data/analytics";
import { MINISTRIES, SECTORS } from "../data/projects";
import { useInView } from "../hooks/usePageMotion";

// ─── Section A — Ministry Performance Table ─────────────────────────────────

type SortKey = "name" | "total" | "high" | "avgScore" | "trend";
const sortVal: Record<SortKey, (m: typeof MINISTRY_STATS[number]) => number | string> = {
  name: (m) => m.name,
  total: (m) => m.total,
  high: (m) => m.high,
  avgScore: (m) => m.avgScore,
  trend: (m) => m.trend,
};

function MinistryTable() {
  const uid = useId();
  const [sortKey, setSortKey] = useState<SortKey>("high");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...MINISTRY_STATS].sort((a, b) => {
    const av = sortVal[sortKey](a), bv = sortVal[sortKey](b);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const cols: Array<[SortKey, string]> = [
    ["name", "Ministry"], ["total", "Projects"], ["high", "High Risk"],
    ["avgScore", "Avg Score"], ["trend", "Trend (QoQ)"],
  ];

  return (
    <article className="an-card" data-reveal>
      <span className="db-card-kicker">Ministry performance</span>
      <h2>Ministry Performance Ranking</h2>
      <div className="db-table-scroll">
        <table id={`${uid}-tbl`}>
          <thead>
            <tr>
              <th style={{ width: 44 }}>Rank</th>
              {cols.map(([key, label]) => (
                <th key={key} className={sortKey === key ? "is-sorted" : ""}>
                  <button type="button" className="db-sort-btn" onClick={() => toggleSort(key)}>
                    {label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, rank) => (
              <tr key={m.name} className="db-clickable-row" onClick={() => { window.location.hash = `#/ministry/${encodeURIComponent(m.name)}`; }}>
                <td>
                  <span className={`db-rank ${rank < 3 ? `db-rank-${rank + 1}` : ""}`}>{rank + 1}</span>
                </td>
                <td style={{ fontWeight: 500 }}>{m.icon} {m.name}</td>
                <td>{m.total.toLocaleString("en-IN")}</td>
                <td><span className="risk-badge risk-high" style={{ minWidth: 38 }}>{m.high}</span></td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{m.avgScore.toFixed(2)}</td>
                <td>
                  <span className={`an-trend ${m.trend >= 0 ? "an-trend-up" : "an-trend-down"}`}>
                    {m.trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(m.trend).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// ─── Section B — Sector stacked bars ────────────────────────────────────────

function SectorDistributionChart() {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const maxTotal = Math.max(...SECTOR_DISTRIBUTION.map((s) => s.high + s.medium + s.low));

  return (
    <article className="an-card an-chart-card" data-reveal>
      <span className="db-card-kicker">Risk spread</span>
      <h2>Risk Distribution by Sector</h2>
      <div ref={ref} className={`an-stacked-chart ${inView ? "is-live" : ""}`}>
        {SECTOR_DISTRIBUTION.sort((a, b) => b.high - a.high).map((s, i) => {
          const total = s.high + s.medium + s.low;
          return (
            <div className="an-stacked-row" key={s.sector} style={{ "--bar-d": `${i * 55}ms` } as CSSProperties}>
              <span className="an-stacked-label">{s.sector}</span>
              <div className="an-stacked-track">
                <span className="an-seg an-seg-high"  style={{ width: `${(s.high / maxTotal) * 100}%`   }} title={`High: ${s.high}`}   />
                <span className="an-seg an-seg-medium" style={{ width: `${(s.medium / maxTotal) * 100}%` }} title={`Med: ${s.medium}`}  />
                <span className="an-seg an-seg-low"   style={{ width: `${(s.low / maxTotal) * 100}%`    }} title={`Low: ${s.low}`}    />
              </div>
              <span className="an-stacked-total">{total}</span>
            </div>
          );
        })}
        <div className="an-stacked-legend">
          <span><i className="an-seg an-seg-high" />High</span>
          <span><i className="an-seg an-seg-medium" />Medium</span>
          <span><i className="an-seg an-seg-low" />Low</span>
        </div>
      </div>
    </article>
  );
}

// ─── Section B — Sector avg score grouped bars ───────────────────────────────

function SectorScoreChart() {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const peak = Math.max(...SECTOR_AVG_SCORES.map((s) => s.score));

  return (
    <article className="an-card an-chart-card" data-reveal>
      <span className="db-card-kicker">Sector benchmarking</span>
      <h2>Average Risk Score by Sector</h2>
      <div ref={ref} className={`db-bar-chart ${inView ? "is-live" : ""}`} style={{ height: 190 }}>
        {SECTOR_AVG_SCORES.map((s, i) => (
          <div
            key={s.sector}
            className="db-bar-col"
            style={{ "--bar-h": `${(s.score / peak) * 100}%`, "--bar-d": `${i * 60}ms` } as CSSProperties}
          >
            <button
              type="button"
              className="db-bar-hit"
              aria-label={`${s.sector}: avg score ${s.score.toFixed(2)}`}
            >
              <span className="db-bar-fill" aria-hidden="true" />
              <span className="db-bar-val">{s.score.toFixed(2)}</span>
            </button>
            <span className="db-bar-label">{s.sector}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

// ─── Section C — Cost escalation stats ──────────────────────────────────────

function CostEscalationStats() {
  return (
    <article className="an-card" data-reveal>
      <span className="db-card-kicker">National financials</span>
      <h2>Cost Escalation Summary</h2>
      <div className="an-cost-grid">
        {[
          { label: "Total Original Cost",    value: "₹37.13 lakh crore", badge: null },
          { label: "Total Revised Cost",     value: "₹42.78 lakh crore", badge: null },
          { label: "Total Expenditure",      value: "₹20.36 lakh crore", badge: null },
          { label: "Cumulative Cost Overrun", value: "₹5.65 lakh crore", badge: "↑ 15.2%" },
        ].map((item) => (
          <div className="an-cost-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.badge && <span className="an-overrun-badge"><ArrowUp size={10} /> {item.badge}</span>}
          </div>
        ))}
      </div>
      {/* Budget utilisation bar */}
      <div className="an-budget-bar-wrap">
        <div className="an-budget-bar">
          <span className="an-bseg an-bseg-exp"   style={{ width: "47.6%" }} title="Expenditure ₹20.36L cr" />
          <span className="an-bseg an-bseg-rev"   style={{ width: "52.4%" }} title="Remaining vs revised" />
        </div>
        <div className="an-budget-legend">
          <span><i className="an-bseg an-bseg-exp" /> Expenditure (₹20.36L cr)</span>
          <span><i className="an-bseg an-bseg-rev" /> Remaining to revised (₹22.42L cr)</span>
          <span className="an-budget-note">Original baseline: ₹37.13L cr · Revised: ₹42.78L cr</span>
        </div>
      </div>
    </article>
  );
}

// ─── Section D — Cost driver bars ───────────────────────────────────────────

function CostDriverChart() {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);

  return (
    <article className="an-card" data-reveal>
      <span className="db-card-kicker">AI-identified drivers</span>
      <h2>Top Drivers of Cost Escalation</h2>
      <div ref={ref} className={`an-driver-chart ${inView ? "is-live" : ""}`}>
        {COST_ESCALATION_DRIVERS.map((d, i) => (
          <div className="an-driver-row" key={d.label}
            style={{ "--drv-d": `${i * 70}ms`, "--drv-target": `${d.pct}%` } as CSSProperties}>
            <span className="an-driver-label">{d.label}</span>
            <div className="an-driver-track">
              <span
                className="an-driver-fill"
                style={{ width: inView ? `${d.pct}%` : "0%",
                         transitionDelay: `${i * 70}ms` }}
              />
            </div>
            <span className="an-driver-pct">{d.pct}%</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function PortfolioRiskDistribution() {
  return (
    <article className="an-card an-chart-wide" data-reveal>
      <span className="db-card-kicker">Current risk split</span>
      <h2>Portfolio Risk Distribution</h2>
      <RiskDonut data={{ high: 210, medium: 540, low: 1231 }} total={1981} />
    </article>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const uid = useId();

  useEffect(() => {
    document.title = "Analytics | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, []);

  return (
    <DashboardShell active="analytics">
      <main className="db-main an-main">
        <section className="an-page-head" data-reveal>
          <div>
            <p className="db-card-kicker">Portfolio intelligence</p>
            <h1>Analytics</h1>
            <p>Portfolio-wide trends, comparisons, and cost intelligence.</p>
          </div>
          <div className="an-filter-bar">
            <div className="db-filter-field">
              <label htmlFor={`${uid}-range`}>Time range</label>
              <select id={`${uid}-range`} className="db-filter-select">
                <option>Last 6 months</option>
                <option>Last 3 months</option>
                <option>Last 1 year</option>
                <option>All time</option>
              </select>
            </div>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-sector`}>Sector</label>
              <select id={`${uid}-sector`} className="db-filter-select">
                <option value="">All</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-min`}>Ministry</label>
              <select id={`${uid}-min`} className="db-filter-select">
                <option value="">All</option>
                {MINISTRIES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </section>

        <MinistryTable />
        <div className="an-two-col">
          <SectorDistributionChart />
          <SectorScoreChart />
        </div>
        <CostEscalationStats />
        <CostDriverChart />
        <PortfolioRiskDistribution />
      </main>
    </DashboardShell>
  );
}
