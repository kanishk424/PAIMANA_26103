import { useEffect, useId, useMemo, useState } from "react";
import { CheckCheck, Search, TriangleAlert } from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { ALERTS, type AlertRecord } from "../data/analytics";
import { MINISTRIES, SECTORS } from "../data/projects";

// ─── Group alerts by relative-time bucket ────────────────────────────────────

function groupAlerts(alerts: AlertRecord[]): Array<{ label: string; items: AlertRecord[] }> {
  const buckets: Record<string, AlertRecord[]> = {};
  alerts.forEach((a) => {
    const bucket =
      a.relativeTime.includes("hour")  ? "Today"
      : a.relativeTime === "Yesterday" ? "Yesterday"
      : "This Week";
    (buckets[bucket] ??= []).push(a);
  });
  return ["Today", "Yesterday", "This Week"]
    .filter((label) => buckets[label]?.length)
    .map((label) => ({ label, items: buckets[label] }));
}

// ─── Single alert card ────────────────────────────────────────────────────────

function AlertCard({ alert, onToggleRead }: { alert: AlertRecord; onToggleRead: (id: string) => void }) {
  return (
    <article
      className={`alert-card ${alert.severity.toLowerCase()} ${!alert.read ? "is-unread" : ""}`}
      onClick={() => { window.location.hash = `#/project/${alert.projectId}`; }}
      style={{ cursor: "pointer" }}
    >
      <span className="alert-edge" aria-hidden="true" />
      <div className="alert-body">
        <div className="alert-top-row">
          <div className="alert-badges">
            <span className={`risk-badge ${alert.severity === "HIGH" ? "risk-high" : "risk-medium"}`}>
              {alert.severity}
            </span>
            <span className={`alert-source-badge ${alert.source === "Predicted" ? "is-predicted" : ""}`}>
              {alert.source}
            </span>
          </div>
          <time className="alert-time">{alert.relativeTime}</time>
        </div>
        <div className="alert-project">
          <strong>{alert.projectId}</strong>
          <span> — {alert.projectName}</span>
          <span className="alert-ministry">{alert.ministry}</span>
        </div>
        <p className="alert-reason"><TriangleAlert size={13} aria-hidden="true" />{alert.reason}</p>
      </div>
      <button
        type="button"
        className={`alert-read-btn ${alert.read ? "is-read" : ""}`}
        onClick={(e) => { e.stopPropagation(); onToggleRead(alert.id); }}
        aria-label={alert.read ? "Mark as unread" : "Mark as read"}
      >
        <CheckCheck size={14} />
        {alert.read ? "Read" : "Mark read"}
      </button>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const uid = useId();
  const [readState, setReadState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ALERTS.map((a) => [a.id, a.read])),
  );
  const [severity, setSeverity] = useState("");
  const [ministry, setMinistry] = useState("");
  const [sector, setSector]     = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch]     = useState("");
  const [debounced, setDebounced] = useState("");
  const [showCount, setShowCount] = useState(10);

  useEffect(() => {
    document.title = "Alerts | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleRead = (id: string) =>
    setReadState((prev) => ({ ...prev, [id]: !prev[id] }));

  const markAllRead = () =>
    setReadState(Object.fromEntries(ALERTS.map((a) => [a.id, true])));

  const unreadCount = ALERTS.filter((a) => !readState[a.id]).length;

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return ALERTS.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (ministry && a.ministry !== ministry) return false;
      if (sector   && a.sector   !== sector)   return false;
      if (unreadOnly && readState[a.id])        return false;
      if (q && !`${a.projectId} ${a.projectName} ${a.reason}`.toLowerCase().includes(q)) return false;
      return true;
    }).map((a) => ({ ...a, read: readState[a.id] }));
  }, [severity, ministry, sector, unreadOnly, debounced, readState]);

  const groups = groupAlerts(filtered.slice(0, showCount));

  return (
    <DashboardShell active="alerts">
      <main className="db-main alerts-main">
        {/* Header */}
        <section className="an-page-head" data-reveal>
          <div>
            <p className="db-card-kicker">Early-warning feed</p>
            <h1 className="alerts-title">
              Alerts
              {unreadCount > 0 && <span className="alerts-unread-badge">{unreadCount} unread</span>}
            </h1>
            <p>Real-time early warnings across all monitored projects.</p>
          </div>
          <button type="button" className="alerts-mark-all" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all as read
          </button>
        </section>

        {/* Filter bar */}
        <section className="an-card alerts-filters" data-reveal>
          <div className="db-filter-bar" style={{ marginTop: 0 }}>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-sev`}>Severity</label>
              <select id={`${uid}-sev`} className="db-filter-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">All</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
              </select>
            </div>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-min`}>Ministry</label>
              <select id={`${uid}-min`} className="db-filter-select" value={ministry} onChange={(e) => setMinistry(e.target.value)}>
                <option value="">All</option>
                {MINISTRIES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-sec`}>Sector</label>
              <select id={`${uid}-sec`} className="db-filter-select" value={sector} onChange={(e) => setSector(e.target.value)}>
                <option value="">All</option>
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="db-filter-field">
              <label htmlFor={`${uid}-unread`} className="alerts-toggle-label">
                <span className={`alerts-toggle ${unreadOnly ? "is-on" : ""}`} aria-hidden="true" />
                Unread only
              </label>
              <input
                id={`${uid}-unread`}
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="sr-only"
              />
            </div>
            <div className="db-filter-field db-filter-search">
              <label htmlFor={`${uid}-search`}>Search</label>
              <div className="db-search-wrap">
                <Search size={15} className="db-search-icon" aria-hidden="true" />
                <input id={`${uid}-search`} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Project name, ID, or keyword" />
              </div>
            </div>
          </div>
        </section>

        {/* Alert feed */}
        {groups.length === 0 ? (
          <div className="alerts-empty" data-reveal>
            <TriangleAlert size={32} aria-hidden="true" />
            <p>No alerts match your current filters.</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="alerts-group" data-reveal>
              <div className="alerts-group-label">{group.label}</div>
              <div className="alerts-feed">
                {group.items.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onToggleRead={toggleRead} />
                ))}
              </div>
            </section>
          ))
        )}

        {filtered.length > showCount && (
          <div className="alerts-load-more" data-reveal>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setShowCount((n) => n + 10)}
            >
              Load more ({filtered.length - showCount} remaining)
            </button>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
