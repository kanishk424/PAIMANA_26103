import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowUpDown,
  BarChart3,
  Download,
  FileText,
  LayoutDashboard,
  Search,
  TrendingUp,
} from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { RiskDonut } from "../components/RiskDonut";
import { MINISTRIES, PROJECTS, SECTORS, riskClass, type ProjectRecord } from "../data/projects";
import { useInView, usePrefersReducedMotion } from "../hooks/usePageMotion";

const sectorChartData = [
  { sector: "Rail", value: 45 }, { sector: "Power", value: 60 }, { sector: "Road", value: 35 }, { sector: "Defence", value: 28 },
  { sector: "Energy", value: 22 }, { sector: "Water", value: 15 }, { sector: "Coal", value: 12 }, { sector: "Steel", value: 8 },
];

const ministryRankData = [
  { rank: 1, ministry: "Railways", projects: 412, highRisk: 45, avgScore: 0.41 }, { rank: 2, ministry: "Power", projects: 386, highRisk: 60, avgScore: 0.44 },
  { rank: 3, ministry: "Road Transport", projects: 298, highRisk: 35, avgScore: 0.36 }, { rank: 4, ministry: "Defence", projects: 245, highRisk: 28, avgScore: 0.33 },
  { rank: 5, ministry: "New & Renewable Energy", projects: 210, highRisk: 22, avgScore: 0.29 }, { rank: 6, ministry: "Jal Shakti", projects: 178, highRisk: 15, avgScore: 0.24 },
  { rank: 7, ministry: "Coal", projects: 142, highRisk: 12, avgScore: 0.21 }, { rank: 8, ministry: "Steel", projects: 110, highRisk: 8, avgScore: 0.18 },
];

const alertItems = [
  { id: "P-12345", name: "XYZ Rail Project", reason: "Cost overrun exceeded 20% threshold", time: "2 hours ago", tone: "high" },
  { id: "P-23456", name: "ABC Power Project", reason: "Physical progress below 40% milestone", time: "5 hours ago", tone: "high" },
  { id: "P-34567", name: "DEF Road Project", reason: "Schedule delay > 6 months", time: "1 day ago", tone: "medium" },
  { id: "P-56789", name: "JKL Energy Proj", reason: "Revised cost awaiting cabinet approval", time: "2 days ago", tone: "medium" },
];

function SummarySection() {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(prefersReducedMotion ? 1 : 0);
  const done = useRef(false);

  useEffect(() => {
    if (!inView || done.current) return;
    if (prefersReducedMotion) { done.current = true; setProgress(1); return; }
    let frame = 0;
    let start: number | null = null;
    const tick = (time: number) => {
      if (start === null) start = time;
      const elapsed = Math.min((time - start) / 1500, 1);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = requestAnimationFrame(tick); else done.current = true;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, prefersReducedMotion]);

  const cards = [
    { label: "Total Projects", value: 1981, sub: "Across 17 ministries", tone: "neutral", icon: BarChart3 },
    { label: "High Risk", value: 210, sub: "10.6% of total", tone: "high", icon: TrendingUp },
    { label: "Medium Risk", value: 540, sub: "27.3% of total", tone: "medium", icon: Activity },
    { label: "Low Risk", value: 1231, sub: "62.1% of total", tone: "low", icon: LayoutDashboard },
  ];

  return <div ref={ref} className="db-summary-grid">{cards.map((card) => {
    const Icon = card.icon;
    return <article className={`db-summary-card db-accent-${card.tone}`} key={card.label}>
      <span className="db-accent-bar" aria-hidden="true" />
      <div className="db-summary-top"><Icon size={18} strokeWidth={1.7} /><span>{card.label}</span></div>
      <strong>{Math.round(card.value * progress).toLocaleString("en-US")}</strong><span className="db-summary-sub">{card.sub}</span>
    </article>;
  })}</div>;
}

function SectorChart() {
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const peak = Math.max(...sectorChartData.map((item) => item.value));
  const [hover, setHover] = useState<number | null>(null);
  return <div className="db-chart-card">
    <span className="db-card-kicker">Sector breakdown</span><h3>Sector-wise High-Risk Projects</h3>
    <div ref={ref} className={`db-bar-chart ${inView ? "is-live" : ""}`}>{sectorChartData.map((item, index) => (
      <div className="db-bar-col" key={item.sector} style={{ "--bar-h": `${(item.value / peak) * 100}%`, "--bar-d": `${index * 60}ms` } as CSSProperties}>
        <button type="button" className="db-bar-hit" onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} aria-label={`${item.sector}: ${item.value} high-risk projects`}>
          <span className={`db-bar-tip ${hover === index ? "is-visible" : ""}`}>{item.sector}: {item.value}</span><span className="db-bar-fill" aria-hidden="true" /><span className="db-bar-val">{item.value}</span>
        </button><span className="db-bar-label">{item.sector}</span>
      </div>
    ))}</div>
  </div>;
}

function RiskDistributionChart() {
  return <div className="db-chart-card">
    <span className="db-card-kicker">Current risk split</span><h3>Risk Distribution</h3>
    <RiskDonut data={{ high: 210, medium: 540, low: 1231 }} total={1981} />
  </div>;
}

type SortKey = "id" | "name" | "ministry" | "risk" | "score";
const sortValue: Record<SortKey, (project: ProjectRecord) => string | number> = { id: (p) => p.id, name: (p) => p.name, ministry: (p) => p.ministry, risk: (p) => p.risk, score: (p) => p.score };

function HighRiskTable() {
  const uid = useId(); const [sortKey, setSortKey] = useState<SortKey>("score"); const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sector, setSector] = useState(""); const [ministry, setMinistry] = useState(""); const [risk, setRisk] = useState(""); const [search, setSearch] = useState(""); const [debounced, setDebounced] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(search), 300); return () => clearTimeout(timer); }, [search]);
  const filtered = PROJECTS.filter((project) => (!sector || project.sector === sector) && (!ministry || project.ministry === ministry) && (!risk || project.risk === risk) && (!debounced || `${project.id} ${project.name}`.toLowerCase().includes(debounced.toLowerCase()))).sort((a, b) => { const av = sortValue[sortKey](a); const bv = sortValue[sortKey](b); const comparison = av < bv ? -1 : av > bv ? 1 : 0; return sortDir === "asc" ? comparison : -comparison; }).slice(0, 10);
  const handleSort = (key: SortKey) => { if (key === sortKey) setSortDir((direction) => direction === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("desc"); } };
  return <div className="db-table-card"><div className="db-table-head-row"><div><span className="db-card-kicker">Critical projects</span><h3>Top 10 High-Risk Projects</h3></div><span className="db-table-caption">Sorted by risk score</span></div>
    <div className="db-filter-bar"><div className="db-filter-field"><label htmlFor={`${uid}-sector`}>Sector</label><select id={`${uid}-sector`} className="db-filter-select" value={sector} onChange={(event) => setSector(event.target.value)}><option value="">All</option>{SECTORS.map((item) => <option key={item}>{item}</option>)}</select></div><div className="db-filter-field"><label htmlFor={`${uid}-ministry`}>Ministry</label><select id={`${uid}-ministry`} className="db-filter-select" value={ministry} onChange={(event) => setMinistry(event.target.value)}><option value="">All</option>{MINISTRIES.map((item) => <option key={item}>{item}</option>)}</select></div><div className="db-filter-field"><label htmlFor={`${uid}-risk`}>Risk</label><select id={`${uid}-risk`} className="db-filter-select" value={risk} onChange={(event) => setRisk(event.target.value)}><option value="">All</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></div><div className="db-filter-field db-filter-search"><label htmlFor={`${uid}-search`}>Search</label><div className="db-search-wrap"><Search size={15} className="db-search-icon" /><input id={`${uid}-search`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Project name or ID" /></div></div></div>
    <div className="db-table-scroll"><table><thead><tr>{([["id", "Project ID"], ["name", "Project Name"], ["ministry", "Ministry"], ["risk", "Risk Level"], ["score", "Risk Score"]] as [SortKey, string][]).map(([key, label]) => <th key={key} className={key === sortKey ? "is-sorted" : ""}><button type="button" className="db-sort-btn" onClick={() => handleSort(key)}>{label} <ArrowUpDown size={12} className={key === sortKey ? "is-active" : ""} /></button></th>)}</tr></thead><tbody>{filtered.map((project) => <tr key={project.id} className="db-clickable-row" onClick={() => { window.location.hash = `#/project/${project.id}`; }}><td className="db-id-cell">{project.id}</td><td>{project.name}</td><td>{project.ministry}</td><td><span className={`risk-badge ${riskClass(project.risk)}`}>{project.risk}</span></td><td className="db-score-cell">{project.score.toFixed(2)}</td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="db-empty-row">No projects match the current filters.</td></tr>}</tbody></table></div>
    <div className="db-actions"><a href="#/projects" className="button button-primary">View All Projects</a><a href="#/dashboard" className="button button-outline"><FileText size={15} /> Download National Report (PDF)</a><a href="#/dashboard" className="button button-outline"><Download size={15} /> Export to CSV</a></div>
  </div>;
}

function MinistryRanking() { return <div className="db-card"><span className="db-card-kicker">Performance</span><h3>Ministry Performance Ranking</h3><div className="db-table-scroll"><table><thead><tr><th>Rank</th><th>Ministry</th><th>Projects</th><th>High Risk</th><th>Avg Score</th></tr></thead><tbody>{ministryRankData.map((item) => <tr key={item.ministry}><td><span className={`db-rank db-rank-${item.rank}`}>{item.rank}</span></td><td>{item.ministry}</td><td>{item.projects}</td><td>{item.highRisk}</td><td>{item.avgScore.toFixed(2)}</td></tr>)}</tbody></table></div></div>; }
function CostEscalation() { const costs = [{ label: "Total Original Cost", value: "₹37.13 lakh crore" }, { label: "Total Revised Cost", value: "₹42.78 lakh crore" }, { label: "Total Expenditure", value: "₹20.36 lakh crore" }, { label: "Cumulative Cost Overrun", value: "₹5.65 lakh crore", badge: "15.2%" }]; return <div className="db-card"><span className="db-card-kicker">Financial overview</span><h3>Cost Escalation Summary</h3><div className="db-cost-grid">{costs.map((cost) => <div className="db-cost-item" key={cost.label}><span>{cost.label}</span><strong>{cost.value}</strong>{cost.badge && <span className="db-cost-badge">{cost.badge}</span>}</div>)}</div></div>; }
function AlertsPanel() { return <div className="db-card"><span className="db-card-kicker">Recent alerts</span><h3>Active Alerts</h3><ul className="db-alert-list">{alertItems.map((alert) => <li key={alert.id} className={`db-alert-item db-alert-${alert.tone}`}><span className="db-alert-dot" /><div><strong>{alert.id} {alert.name}</strong><p>{alert.reason}</p></div><time>{alert.time}</time></li>)}</ul><a href="#/dashboard" className="db-alert-link">View All Alerts →</a></div>; }

export default function DashboardPage() {
  useEffect(() => { document.title = "Dashboard | PAIMANA-AI"; window.scrollTo({ top: 0 }); return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; }; }, []);
  return <DashboardShell active="dashboard"><main className="db-main"><SummarySection /><div className="db-charts-row"><SectorChart /><RiskDistributionChart /></div><HighRiskTable /><div className="db-extras-row"><MinistryRanking /><div className="db-extras-col"><CostEscalation /><AlertsPanel /></div></div></main></DashboardShell>;
}