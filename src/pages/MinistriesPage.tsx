import { useEffect, useId, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { RiskDonut } from "../components/RiskDonut";
import { MINISTRY_STATS } from "../data/analytics";
import { PROJECTS, riskClass } from "../data/projects";

// ─── helpers ───────────────────────────────────────────────────────────────

function riskColor(avg: number) {
  return avg >= 0.6 ? "#dc2626" : avg >= 0.3 ? "#d98a2b" : "#4e9a68";
}

// ─── Ministry Card ──────────────────────────────────────────────────────────

function MinistryCard({ ministry }: { ministry: typeof MINISTRY_STATS[number] }) {
  const total = ministry.high + ministry.medium + ministry.low;
  const highW   = (ministry.high   / total) * 100;
  const mediumW = (ministry.medium / total) * 100;
  const lowW    = (ministry.low    / total) * 100;
  const avgColor = riskColor(ministry.avgScore);

  return (
    <a
      className="min-card"
      href={`#/ministry/${encodeURIComponent(ministry.name)}`}
      aria-label={`${ministry.name} — ${ministry.total} projects`}
    >
      <div className="min-card-head">
        <span className="min-icon" aria-hidden="true">{ministry.icon}</span>
        <span className="min-avg-badge" style={{ color: avgColor, borderColor: avgColor }}>
          {ministry.avgScore.toFixed(2)}
        </span>
      </div>
      <h2>{ministry.name}</h2>
      <strong className="min-total">{ministry.total.toLocaleString("en-IN")}</strong>
      <span className="min-total-label">projects</span>

      <div className="min-risk-track" aria-label={`High ${ministry.high}, Medium ${ministry.medium}, Low ${ministry.low}`}>
        <span style={{ width: `${highW}%`,   background: "#dc2626" }} title={`High: ${ministry.high}`}   />
        <span style={{ width: `${mediumW}%`, background: "#d98a2b" }} title={`Med: ${ministry.medium}`}  />
        <span style={{ width: `${lowW}%`,    background: "#4e9a68" }} title={`Low: ${ministry.low}`}    />
      </div>
      <div className="min-risk-labels">
        <span style={{ color: "#b33d3d" }}>H {ministry.high}</span>
        <span style={{ color: "#a96518" }}>M {ministry.medium}</span>
        <span style={{ color: "#34764b" }}>L {ministry.low}</span>
      </div>
    </a>
  );
}

// ─── Main Ministries Index ──────────────────────────────────────────────────

export default function MinistriesPage() {
  const [search, setSearch] = useState("");
  const uid = useId();

  useEffect(() => {
    document.title = "Ministries | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? MINISTRY_STATS.filter((m) => m.name.toLowerCase().includes(q)) : [...MINISTRY_STATS];
  }, [search]);

  return (
    <DashboardShell active="ministries">
      <main className="db-main min-main">
        <section className="an-page-head" data-reveal>
          <div>
            <p className="db-card-kicker">Ministry index</p>
            <h1>Ministries</h1>
            <p>17 ministries · 1,981 projects monitored nationally.</p>
          </div>
        </section>

        <section className="an-card min-search-card" data-reveal>
          <div className="db-filter-field db-filter-search" style={{ flex: 1, maxWidth: 380 }}>
            <label htmlFor={`${uid}-search`}>Find ministry</label>
            <div className="db-search-wrap">
              <span className="db-search-icon" aria-hidden="true">🔍</span>
              <input
                id={`${uid}-search`}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ministry name"
              />
            </div>
          </div>
        </section>

        <div className="min-grid" data-reveal>
          {shown.map((m) => <MinistryCard key={m.name} ministry={m} />)}
          {shown.length === 0 && (
            <p className="db-empty-row" style={{ gridColumn: "1/-1" }}>No ministries match your search.</p>
          )}
        </div>
      </main>
    </DashboardShell>
  );
}

// ─── Ministry Detail page (/ministry/:name) ─────────────────────────────────

type ProjSortKey = "id" | "name" | "sector" | "risk" | "score";
const projSortVal: Record<ProjSortKey, (p: typeof PROJECTS[number]) => string | number> = {
  id: (p) => p.id, name: (p) => p.name, sector: (p) => p.sector,
  risk: (p) => p.risk, score: (p) => p.score,
};

function MinistryRiskDistribution({ name }: { name: string }) {
  const stat = MINISTRY_STATS.find((ministry) => ministry.name === name);
  if (!stat) return null;
  return (
    <article className="an-card an-chart-card" data-reveal>
      <span className="db-card-kicker">Current risk split</span>
      <h2>Risk Distribution - {name}</h2>
      <RiskDonut data={{ high: stat.high, medium: stat.medium, low: stat.low }} total={stat.total} centerLabel="Ministry Projects" />
    </article>
  );
}

function MinistryProjectsTable({ name }: { name: string }) {
  const uid = useId();
  const [sortKey, setSortKey] = useState<ProjSortKey>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const projects = useMemo(() =>
    PROJECTS.filter((p) => p.ministry === name).sort((a, b) => {
      const av = projSortVal[sortKey](a), bv = projSortVal[sortKey](b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    }), [name, sortKey, sortDir]);

  const perPage = 10;
  const pageCount = Math.max(1, Math.ceil(projects.length / perPage));
  const safePage = Math.min(page, pageCount);
  const rows = projects.slice((safePage - 1) * perPage, safePage * perPage);

  const toggleSort = (key: ProjSortKey) => {
    if (key === sortKey) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const headers: Array<[ProjSortKey, string]> = [
    ["id", "Project ID"], ["name", "Project Name"], ["sector", "Sector"],
    ["risk", "Risk Level"], ["score", "Risk Score"],
  ];

  return (
    <article className="an-card" data-reveal>
      <div className="db-table-head-row">
        <div>
          <span className="db-card-kicker">Ministry projects</span>
          <h2>Projects in {name}</h2>
        </div>
        <span className="db-table-caption">{projects.length} projects</span>
      </div>
      <div id={`${uid}-tbl`} className="db-table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map(([key, label]) => (
                <th key={key} className={sortKey === key ? "is-sorted" : ""}>
                  <button type="button" className="db-sort-btn" onClick={() => toggleSort(key)}>
                    {label} <ArrowUpDown size={12} className={sortKey === key ? "is-active" : ""} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="db-clickable-row"
                onClick={() => { window.location.hash = `#/project/${p.id}`; }}
              >
                <td className="db-id-cell">{p.id}</td>
                <td>{p.name}</td>
                <td>{p.sector}</td>
                <td><span className={`risk-badge ${riskClass(p.risk)}`}>{p.risk}</span></td>
                <td className="db-score-cell">{p.score.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="db-empty-row">No projects found for this ministry.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="db-pagination">
        <button type="button" className="db-page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>← Prev</button>
        <span className="db-page-info">Page {safePage} of {pageCount}</span>
        <button type="button" className="db-page-btn" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>Next →</button>
      </div>
    </article>
  );
}

export function MinistryDetailPage({ ministryName }: { ministryName: string }) {
  const stat = MINISTRY_STATS.find((m) => m.name === ministryName);

  useEffect(() => {
    document.title = `${ministryName} | PAIMANA-AI`;
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, [ministryName]);

  if (!stat) {
    return (
      <DashboardShell active="ministries">
        <main className="db-main">
          <section className="project-not-found">
            <p className="db-card-kicker">Ministry record</p>
            <h1>Ministry not found</h1>
            <p>No data is available for the requested ministry.</p>
            <a className="button button-primary" href="#/ministries">Back to Ministries</a>
          </section>
        </main>
      </DashboardShell>
    );
  }

  const summaryCards = [
    { label: "Total Projects", value: stat.total, tone: "neutral" },
    { label: "High Risk",      value: stat.high,   tone: "high"    },
    { label: "Medium Risk",    value: stat.medium,  tone: "medium"  },
    { label: "Low Risk",       value: stat.low,     tone: "low"     },
  ];



  return (
    <DashboardShell active="ministries">
      <main className="db-main">
        {/* Breadcrumb */}
        <div className="project-breadcrumb">
          <a href="#/ministries">Ministries</a><span>/</span><span>{ministryName}</span>
        </div>
        <a href="#/ministries" className="project-back"><ArrowLeft size={15} /> Back to Ministries</a>

        {/* Ministry banner */}
        <section className="min-banner" data-reveal>
          <span className="min-banner-icon">{stat.icon}</span>
          <div>
            <p className="db-card-kicker">Ministry overview</p>
            <h1>{ministryName}</h1>
          </div>
        </section>

        {/* Summary cards */}
        <div className="db-summary-grid" style={{ marginTop: 20 }} data-reveal>
          {summaryCards.map((c) => (
            <article className={`db-summary-card db-accent-${c.tone}`} key={c.tone}>
              <span className="db-accent-bar" aria-hidden="true" />
              <div className="db-summary-top"><span>{c.label}</span></div>
              <strong>{c.value.toLocaleString("en-IN")}</strong>
              <span className="db-summary-sub">{c.label === "Total Projects" ? `Avg score: ${stat.avgScore.toFixed(2)}` : `${Math.round((c.value / stat.total) * 100)}% of ministry total`}</span>
            </article>
          ))}
        </div>

        {/* Charts row */}
        <div className="an-two-col" style={{ marginTop: 20 }}>
          <article className="an-card an-chart-card" data-reveal>
            <span className="db-card-kicker">Ministry risk mix</span>
            <h2>Risk Distribution — {ministryName}</h2>
            <div style={{ display: "flex", gap: 16, flexDirection: "column", marginTop: 18 }}>
              {[
                { label: "High Risk",   value: stat.high,   pct: Math.round((stat.high   / stat.total) * 100), color: "#dc2626" },
                { label: "Medium Risk", value: stat.medium, pct: Math.round((stat.medium / stat.total) * 100), color: "#d98a2b" },
                { label: "Low Risk",    value: stat.low,    pct: Math.round((stat.low    / stat.total) * 100), color: "#4e9a68" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#746670" }}>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.label}</span>
                    <span>{item.value} projects ({item.pct}%)</span>
                  </div>
                  <div className="an-stacked-track" style={{ height: 8 }}>
                    <span style={{ width: `${item.pct}%`, background: item.color, height: "100%", borderRadius: 99, display: "block", transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
          <MinistryRiskDistribution name={ministryName} />
        </div>

        {/* Projects table */}
        <MinistryProjectsTable name={ministryName} />
      </main>
    </DashboardShell>
  );
}
