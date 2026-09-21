import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
} from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { MINISTRIES, PROJECTS, SECTORS, riskClass, type ProjectRecord, type ProjectStatus } from "../data/projects";

type View = "table" | "cards";
type SortKey = "id" | "name" | "ministry" | "sector" | "risk" | "score" | "status";

const statusClass: Record<ProjectStatus, string> = { Ongoing: "status-ongoing", Completed: "status-completed", Stalled: "status-stalled" };
const sortValue: Record<SortKey, (project: ProjectRecord) => string | number> = {
  id: (project) => project.id, name: (project) => project.name, ministry: (project) => project.ministry,
  sector: (project) => project.sector, risk: (project) => project.risk, score: (project) => project.score, status: (project) => project.status,
};

function RouteProject({ id }: { id: string }) {
  return <a href={`#/project/${id}`} onClick={(event) => { event.stopPropagation(); }}>{id}</a>;
}

export default function ProjectsPage() {
  const uid = useId();
  const [view, setView] = useState<View>("table");
  const [sector, setSector] = useState("");
  const [ministry, setMinistry] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = "All Projects | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return PROJECTS.filter((project) => {
      if (sector && project.sector !== sector) return false;
      if (ministry && project.ministry !== ministry) return false;
      if (risk && project.risk !== risk) return false;
      if (status && project.status !== status) return false;
      return !query || `${project.id} ${project.name}`.toLowerCase().includes(query);
    }).sort((a, b) => {
      const aValue = sortValue[sortKey](a); const bValue = sortValue[sortKey](b);
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [debouncedSearch, ministry, risk, sector, sortDirection, sortKey, status]);

  const perPage = 20;
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const activePage = Math.min(page, pageCount);
  const currentProjects = filtered.slice((activePage - 1) * perPage, activePage * perPage);

  const setFilter = (update: () => void) => { update(); setPage(1); };
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDirection("desc"); }
    setPage(1);
  };

  const headers: Array<[SortKey, string]> = [["id", "Project ID"], ["name", "Project Name"], ["ministry", "Ministry"], ["sector", "Sector"], ["risk", "Risk Level"], ["score", "Risk Score"], ["status", "Status"]];

  return (
    <DashboardShell active="projects">
      <main className="db-main projects-main">
        <section className="projects-heading" data-reveal>
          <div>
            <p className="db-card-kicker">National portfolio</p>
            <h1>All Projects</h1>
            <p>1,981 projects across 17 ministries</p>
          </div>
          <div className="view-switcher" aria-label="Project view">
            <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")} aria-pressed={view === "table"}><List size={16} /> Table</button>
            <button type="button" className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")} aria-pressed={view === "cards"}><Grid2X2 size={15} /> Cards</button>
          </div>
        </section>

        <section className="projects-card" data-reveal>
          <div className="db-filter-bar projects-filter-bar">
            <div className="db-filter-field"><label htmlFor={`${uid}-sector`}>Sector</label><select id={`${uid}-sector`} className="db-filter-select" value={sector} onChange={(event) => setFilter(() => setSector(event.target.value))}><option value="">All</option>{SECTORS.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="db-filter-field"><label htmlFor={`${uid}-ministry`}>Ministry</label><select id={`${uid}-ministry`} className="db-filter-select" value={ministry} onChange={(event) => setFilter(() => setMinistry(event.target.value))}><option value="">All</option>{MINISTRIES.map((item) => <option key={item}>{item}</option>)}</select></div>
            <div className="db-filter-field"><label htmlFor={`${uid}-risk`}>Risk level</label><select id={`${uid}-risk`} className="db-filter-select" value={risk} onChange={(event) => setFilter(() => setRisk(event.target.value))}><option value="">All</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></div>
            <div className="db-filter-field"><label htmlFor={`${uid}-status`}>Status</label><select id={`${uid}-status`} className="db-filter-select" value={status} onChange={(event) => setFilter(() => setStatus(event.target.value))}><option value="">All</option><option>Ongoing</option><option>Completed</option><option>Stalled</option></select></div>
            <div className="db-filter-field db-filter-search"><label htmlFor={`${uid}-search`}>Search</label><div className="db-search-wrap"><Search size={15} className="db-search-icon" aria-hidden="true" /><input id={`${uid}-search`} type="search" value={search} onChange={(event) => setFilter(() => setSearch(event.target.value))} placeholder="Search by project name or ID" /></div></div>
          </div>

          <div className="projects-count" aria-live="polite">Showing {currentProjects.length} matching sample projects</div>

          {view === "table" ? (
            <div className="db-table-scroll projects-table-scroll"><table className="projects-table"><thead><tr>{headers.map(([key, label]) => <th key={key} className={sortKey === key ? "is-sorted" : ""}><button type="button" className="db-sort-btn" onClick={() => toggleSort(key)}>{label}<ArrowUpDown size={12} className={sortKey === key ? "is-active" : ""} /></button></th>)}</tr></thead><tbody>{currentProjects.map((project) => <tr key={project.id} className="db-clickable-row" onClick={() => { window.location.hash = `#/project/${project.id}`; }}><td className="db-id-cell"><RouteProject id={project.id} /></td><td>{project.name}</td><td>{project.ministry}</td><td>{project.sector}</td><td><span className={`risk-badge ${riskClass(project.risk)}`}>{project.risk}</span></td><td className="db-score-cell">{project.score.toFixed(2)}</td><td><span className={`project-status ${statusClass[project.status]}`}>{project.status}</span></td></tr>)}{currentProjects.length === 0 && <tr><td colSpan={7} className="db-empty-row">No projects match the current filters.</td></tr>}</tbody></table></div>
          ) : (
            <div className="project-card-grid">{currentProjects.map((project) => <a className="project-list-card" href={`#/project/${project.id}`} key={project.id}><div className="project-list-card-head"><div><span className="project-list-id">{project.id}</span><h2>{project.name}</h2></div><span className={`risk-badge ${riskClass(project.risk)}`}>{project.risk}</span></div><div className="project-tags"><span>{project.ministry}</span><span>{project.sector}</span><span className={statusClass[project.status]}>{project.status}</span></div><div className="project-score-line"><span>Risk score</span><strong>{project.score.toFixed(2)}</strong></div><div className={`project-score-track ${project.risk.toLowerCase()}`}><span style={{ width: `${project.score * 100}%` }} /></div></a>)}</div>
          )}

          <div className="db-pagination projects-pagination">
            <button type="button" className="db-page-btn" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}><ChevronLeft size={16} /> Prev</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button type="button" key={number} className={`project-page-number ${activePage === number ? "is-active" : ""}`} onClick={() => setPage(number)}>{number}</button>)}
            <button type="button" className="db-page-btn" disabled={activePage === pageCount} onClick={() => setPage(activePage + 1)}>Next <ChevronRight size={16} /></button>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}