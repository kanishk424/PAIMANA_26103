import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, TriangleAlert, X } from "lucide-react";
import { DashboardShell, ministryNavItems } from "../components/DashboardShell";
import { NATIONAL, ministryConfig, pct, type MinistryUserConfig } from "../data/ministryUser";
import { riskClass } from "../data/projects";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-layer">
      <button type="button" className="modal-backdrop is-visible" aria-label="Close dialog" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

function SummaryCards({ config }: { config: MinistryUserConfig }) {
  const cards = [
    { label: "Total Projects", value: config.total, pct: 100, tone: "neutral" },
    { label: "High Risk", value: config.high, pct: pct(config.high, config.total), tone: "high" },
    { label: "Medium Risk", value: config.medium, pct: pct(config.medium, config.total), tone: "medium" },
    { label: "Low Risk", value: config.low, pct: pct(config.low, config.total), tone: "low" },
  ];

  return (
    <div className="db-summary-grid">
      {cards.map((card) => (
        <article className={`db-summary-card db-accent-${card.tone}`} key={card.label}>
          <span className="db-accent-bar" aria-hidden="true" />
          <div className="db-summary-top">
            <span>{card.label}</span>
            {card.tone !== "neutral" && <span className={`min-share-pill min-share-${card.tone}`}>{card.pct}%</span>}
          </div>
          <strong>{card.value.toLocaleString("en-IN")}</strong>
          <span className="db-summary-sub">{card.tone === "neutral" ? `${config.name} portfolio` : `${card.pct}% of ministry total`}</span>
        </article>
      ))}
    </div>
  );
}

function AttentionCard({ config }: { config: MinistryUserConfig }) {
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [escalateFor, setEscalateFor] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<Record<string, string>>({});
  const [escalations, setEscalations] = useState<Record<string, string>>({});

  return (
    <article className="mu-card mu-attention" data-reveal>
      <div className="mu-card-head">
        <div>
          <span className="db-card-kicker">Priority queue</span>
          <h2><TriangleAlert size={18} /> Requires Immediate Attention</h2>
        </div>
      </div>
      <ul className="mu-attention-list">
        {config.attention.map((project) => (
          <li key={project.id}>
            <div className="mu-attention-top">
              <strong>{project.id}</strong>
              <span>{project.name}</span>
              <span className="mu-score" style={{ color: project.score >= 0.6 ? "#b33d3d" : project.score >= 0.3 ? "#a96518" : "#34764b" }}>
                {project.score.toFixed(2)} · {project.sector}
              </span>
            </div>
            <p>{project.issue}</p>
            <div className="mu-row-actions">
              <a className="mu-ghost-btn" href={`#/project/${project.id}`}>View Details</a>
              <button type="button" className="mu-ghost-btn" onClick={() => setScheduleFor(project.id)}>Schedule Review</button>
              <button type="button" className="mu-ghost-btn" onClick={() => setEscalateFor(project.id)}>
                {escalations[project.id] ? "Escalation Sent" : "Request Escalation"}
              </button>
              {scheduled[project.id] && <span className="mu-scheduled">Review {scheduled[project.id]}</span>}
            </div>
          </li>
        ))}
      </ul>
      <a className="mu-card-link" href={`#/dashboard/${config.slug}/projects`}>View All High-Risk Projects →</a>

      {scheduleFor && (
        <Modal title={`Schedule review — ${scheduleFor}`} onClose={() => setScheduleFor(null)}>
          <form className="modal-form" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setScheduled((current) => ({ ...current, [scheduleFor]: String(data.get("date")) }));
            setScheduleFor(null);
          }}>
            <label htmlFor="review-date">Review date</label>
            <input id="review-date" name="date" type="date" required />
            <label htmlFor="review-note">Agenda note</label>
            <textarea id="review-note" name="note" rows={3} placeholder="What should be reviewed?" />
            <button type="submit" className="button button-primary">Confirm Review</button>
          </form>
        </Modal>
      )}

      {escalateFor && (
        <Modal title={`Request escalation — ${escalateFor}`} onClose={() => setEscalateFor(null)}>
          <form className="modal-form" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setEscalations((current) => ({ ...current, [escalateFor]: String(data.get("reason")) }));
            setEscalateFor(null);
          }}>
            <label htmlFor="esc-reason">Escalation reason</label>
            <textarea id="esc-reason" name="reason" rows={4} required placeholder="Describe why MoSPI support is required" />
            <button type="submit" className="button button-primary">Send to MoSPI</button>
          </form>
        </Modal>
      )}
    </article>
  );
}

function ActionItemsCard({ config }: { config: MinistryUserConfig }) {
  const groups = [
    { label: "Review Meetings Pending", tone: "overdue", items: config.reviewMeetings },
    { label: "Recovery Plans to Approve", tone: "today", items: config.recoveryApprovals },
    { label: "Escalation Responses from MoSPI", tone: "done", items: config.escalationsFromMospi },
  ];

  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">Your queue</span><h2>📋 My Action Items</h2></div></div>
      <div className="mu-task-groups">
        {groups.map((group) => (
          <section key={group.label}>
            <h3><i className={`mu-dot mu-dot-${group.tone}`} />{group.label}</h3>
            {group.items.length === 0 && <p className="mu-empty-line">Nothing pending.</p>}
            {group.items.map((item) => (
              <a className="mu-task-row" href={item.href} key={item.id}>
                <span>{item.label}</span>
                <small>{item.due}</small>
              </a>
            ))}
          </section>
        ))}
      </div>
      <a className="mu-card-link" href={`#/dashboard/${config.slug}/projects`}>View All Tasks →</a>
    </article>
  );
}

function EscalationsCard({ config }: { config: MinistryUserConfig }) {
  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">Sent to MoSPI</span><h2>📤 Recent Escalations</h2></div></div>
      <ul className="mu-esc-list">
        {config.escalations.map((item) => (
          <li key={item.id}>
            <div className="mu-esc-top">
              <a href={`#/project/${item.projectId}`}>{item.projectId} {item.projectName}</a>
              <span className={item.status === "MoSPI responded" ? "mu-status mu-status-done" : "mu-status mu-status-pending"}>
                {item.status === "MoSPI responded" ? "✅ MoSPI responded" : "⏳ Pending MoSPI response"}
              </span>
            </div>
            <p>{item.reason}</p>
            {item.response && <p className="mu-esc-response"><strong>MoSPI:</strong> {item.response}</p>}
            <time>{item.time}</time>
          </li>
        ))}
      </ul>
      <div className="mu-card-actions">
        <a className="mu-card-link" href={`#/dashboard/${config.slug}/escalations`}>View All Escalations →</a>
        <a className="button button-primary" href={`#/dashboard/${config.slug}/escalations`}>New Escalation</a>
      </div>
    </article>
  );
}

function RecoveryCard({ config }: { config: MinistryUserConfig }) {
  const groups = [
    { label: "Pending Approval", status: "Pending Approval" as const },
    { label: "Approved", status: "Approved" as const },
    { label: "Overdue", status: "Overdue" as const },
  ];

  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">Plan pipeline</span><h2>📋 Recovery Plans Status</h2></div></div>
      <div className="mu-task-groups">
        {groups.map((group) => {
          const items = config.recoveryPlans.filter((plan) => plan.status === group.status);
          return (
            <section key={group.label}>
              <h3 className={group.status === "Overdue" ? "mu-heading-overdue" : ""}>
                <i className={`mu-dot mu-dot-${group.status === "Overdue" ? "overdue" : group.status === "Approved" ? "done" : "today"}`} />
                {group.label}
              </h3>
              {items.length === 0 && <p className="mu-empty-line">None.</p>}
              {items.map((plan) => (
                <a className="mu-task-row" href={`#/project/${plan.projectId}`} key={plan.id}>
                  <span>{plan.projectId} {plan.projectName}</span>
                  <small>{plan.submitted}</small>
                </a>
              ))}
            </section>
          );
        })}
      </div>
      <a className="mu-card-link" href={`#/dashboard/${config.slug}/recovery`}>View All Recovery Plans →</a>
    </article>
  );
}

function SectorTable({ config }: { config: MinistryUserConfig }) {
  const [sortKey, setSortKey] = useState<"sector" | "projects" | "high" | "pct">("high");
  const [asc, setAsc] = useState(false);

  const rows = useMemo(() => config.sectors.map((row) => ({
    ...row,
    pct: pct(row.high, row.projects),
    pill: pct(row.high, row.projects) > 30 ? "risk-high" : pct(row.high, row.projects) >= 15 ? "risk-medium" : "risk-low",
  })).sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return asc ? cmp : -cmp;
  }), [asc, config.sectors, sortKey]);

  const headers: Array<["sector" | "projects" | "high" | "pct", string]> = [
    ["sector", "Sector"], ["projects", "Projects"], ["high", "High Risk"], ["pct", "% High"],
  ];

  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">Within {config.name}</span><h2>Sector Performance</h2></div></div>
      <div className="db-table-scroll">
        <table>
          <thead><tr>{headers.map(([key, label]) => (
            <th key={key} className={sortKey === key ? "is-sorted" : ""}>
              <button type="button" className="db-sort-btn" onClick={() => { if (key === sortKey) setAsc((value) => !value); else { setSortKey(key); setAsc(false); } }}>
                {label} <ArrowUpDown size={12} className={sortKey === key ? "is-active" : ""} />
              </button>
            </th>
          ))}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sector} className="db-clickable-row">
                <td>{row.sector}</td>
                <td>{row.projects}</td>
                <td>{row.high}</td>
                <td><span className={`risk-badge ${row.pill}`}>{row.pct}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ComparisonChart({ config }: { config: MinistryUserConfig }) {
  const pairs = [
    { label: "High Risk", national: NATIONAL.highPct, ministry: pct(config.high, config.total) },
    { label: "Medium Risk", national: NATIONAL.mediumPct, ministry: pct(config.medium, config.total) },
    { label: "Low Risk", national: NATIONAL.lowPct, ministry: pct(config.low, config.total) },
  ];
  const worst = pairs[0].ministry > pairs[0].national;

  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">Benchmarking</span><h2>{config.name} vs National Average</h2></div></div>
      <div className="mu-compare">
        {pairs.map((pair) => {
          const better = pair.label === "Low Risk" ? pair.ministry > pair.national : pair.ministry < pair.national;
          return (
            <div className="mu-compare-row" key={pair.label}>
              <span className="mu-compare-label">{pair.label}</span>
              <div className="mu-compare-bars">
                <div className="mu-compare-line">
                  <small>National {pair.national}%</small>
                  <div className="mu-compare-track"><span style={{ width: `${pair.national}%` }} className="mu-bar-national" /></div>
                </div>
                <div className="mu-compare-line">
                  <small>{config.name} {pair.ministry}%</small>
                  <div className="mu-compare-track"><span style={{ width: `${pair.ministry}%` }} className="mu-bar-ministry" /></div>
                </div>
              </div>
              <span className={better ? "mu-delta mu-delta-good" : "mu-delta mu-delta-bad"}>{better ? "✓" : "▲"}</span>
            </div>
          );
        })}
      </div>
      <div className={`mu-callout ${worst ? "mu-callout-bad" : "mu-callout-good"}`}>
        {worst
          ? `⚠ Your ministry's high-risk share (${pairs[0].ministry}%) is above the national average (${pairs[0].national}%). Immediate attention needed.`
          : `✓ Your ministry's high-risk share (${pairs[0].ministry}%) is below the national average (${pairs[0].national}%). Keep the current delivery discipline.`}
      </div>
    </article>
  );
}

function AllProjectsTable({ config, full }: { config: MinistryUserConfig; full?: boolean }) {
  const [sortKey, setSortKey] = useState<"id" | "name" | "sector" | "risk" | "score">("score");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const sorted = useMemo(() => [...config.projects].sort((a, b) => {
    const av = a[sortKey]; const bv = b[sortKey];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return asc ? cmp : -cmp;
  }), [asc, config.projects, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, pageCount);
  const rows = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const headers: Array<["id" | "name" | "sector" | "risk" | "score", string]> = [
    ["id", "Project ID"], ["name", "Project Name"], ["sector", "Sector"], ["risk", "Risk Level"], ["score", "Risk Score"],
  ];

  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head">
        <div><span className="db-card-kicker">Your portfolio</span><h2>All {config.name} Projects</h2></div>
        <span className="db-table-caption">{sorted.length} projects</span>
      </div>
      <div className="db-table-scroll">
        <table>
          <thead><tr>{headers.map(([key, label]) => (
            <th key={key} className={sortKey === key ? "is-sorted" : ""}>
              <button type="button" className="db-sort-btn" onClick={() => { if (key === sortKey) setAsc((value) => !value); else { setSortKey(key); setAsc(false); } }}>
                {label} <ArrowUpDown size={12} className={sortKey === key ? "is-active" : ""} />
              </button>
            </th>
          ))}
            <th>My Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((project) => (
              <tr key={project.id} className="db-clickable-row" onClick={() => { window.location.hash = `#/project/${project.id}`; }}>
                <td className="db-id-cell">{project.id}</td>
                <td>{project.name}</td>
                <td>{project.sector}</td>
                <td><span className={`risk-badge ${riskClass(project.risk)}`}>{project.risk}</span></td>
                <td className="db-score-cell">{project.score.toFixed(2)}</td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className="mu-row-actions">
                    <a className="mu-ghost-btn" href={`#/project/${project.id}`}>Review</a>
                    <a className="mu-ghost-btn" href={`#/dashboard/${config.slug}/escalations`}>Escalate</a>
                    {!project.hasRecoveryPlan && <a className="mu-ghost-btn" href={`#/dashboard/${config.slug}/recovery`}>Recovery</a>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="db-empty-row">No projects found.</td></tr>}
          </tbody>
        </table>
      </div>
      {!full && (
        <div className="db-pagination">
          <button type="button" className="db-page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft size={16} /> Prev</button>
          <span className="db-page-info">Page {safePage} of {pageCount}</span>
          <button type="button" className="db-page-btn" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>Next <ChevronRight size={16} /></button>
        </div>
      )}
    </article>
  );
}

function ministryAnswer(config: MinistryUserConfig) {
  return (question: string) => {
    const lower = question.toLowerCase();
    if (lower.includes("risk")) return `${config.name} currently has ${config.high} high-risk projects (${pct(config.high, config.total)}% of your ${config.total}), against a national average of ${NATIONAL.highPct}%.`;
    if (lower.includes("escalat")) return `You have ${config.escalations.filter((item) => item.status === "Pending MoSPI response").length} escalation(s) awaiting a MoSPI response.`;
    if (lower.includes("recovery")) return `${config.recoveryPlans.filter((plan) => plan.status === "Pending Approval").length} recovery plan(s) are pending your approval and ${config.recoveryPlans.filter((plan) => plan.status === "Overdue").length} are overdue.`;
    return `${config.name} monitors ${config.total} projects. Ask me about high-risk items, escalations, or recovery plan status.`;
  };
}

function PanelList({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <article className="mu-card" data-reveal>
      <div className="mu-card-head"><div><span className="db-card-kicker">{kicker}</span><h2>{title}</h2></div></div>
      {children}
    </article>
  );
}

export default function MinistryDashboardPage({ slug, section = "overview" }: { slug: string; section?: string }) {
  const config = ministryConfig(slug);

  useEffect(() => {
    document.title = config ? `${config.name} Dashboard | PAIMANA-AI` : "Ministry Dashboard | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, [config]);

  if (!config) {
    return (
      <DashboardShell active="dashboard" items={ministryNavItems(slug, section)}>
        <main className="db-main">
          <section className="project-not-found">
            <p className="db-card-kicker">Ministry workspace</p>
            <h1>Ministry not found</h1>
            <p>No ministry workspace exists for this route.</p>
            <a className="button button-primary" href="#/dashboard">Back to Dashboard</a>
          </section>
        </main>
      </DashboardShell>
    );
  }

  const items = ministryNavItems(slug, section);

  return (
    <DashboardShell
      active="dashboard"
      items={items}
      aiContext={`Ask about ${config.name}'s projects`}
      aiSuggestions={[`Why is ${config.attention[0]?.id ?? "this project"} high risk?`, "Which projects need a recovery plan?", "Summarise my pending escalations"]}
      aiAnswer={ministryAnswer(config)}
      autoOpenAI={section === "assistant"}
    >
      <main className="db-main mu-main">
        <section className="an-page-head" data-reveal>
          <div>
            <p className="db-card-kicker">Ministry workspace · {config.officialLabel}</p>
            <h1>{config.icon} {config.name} Dashboard</h1>
            <p>Accountability view for your ministry's {config.total} monitored projects.</p>
          </div>
          <a className="mu-back-link" href="#/dashboard"><ArrowLeft size={15} /> National view</a>
        </section>

        {section === "overview" && (
          <>
            <SummaryCards config={config} />
            <div className="mu-two-col">
              <div className="mu-col-left">
                <AttentionCard config={config} />
                <ActionItemsCard config={config} />
                <EscalationsCard config={config} />
                <RecoveryCard config={config} />
              </div>
              <div className="mu-col-right">
                <SectorTable config={config} />
                <ComparisonChart config={config} />
                <AllProjectsTable config={config} />
              </div>
            </div>
          </>
        )}

        {section === "projects" && <AllProjectsTable config={config} full />}

        {section === "alerts" && (
          <PanelList title={`⚠ Alerts — ${config.name}`} kicker="Early warnings">
            <ul className="mu-esc-list">
              {config.attention.map((project) => (
                <li key={project.id}>
                  <div className="mu-esc-top"><a href={`#/project/${project.id}`}>{project.id} {project.name}</a><span className="mu-status mu-status-pending">Detected</span></div>
                  <p>{project.issue}</p>
                  <time>Risk score {project.score.toFixed(2)} · {project.sector}</time>
                </li>
              ))}
            </ul>
          </PanelList>
        )}

        {section === "escalations" && (
          <PanelList title="📤 Escalations to MoSPI" kicker="Central coordination">
            <ul className="mu-esc-list">
              {config.escalations.map((item) => (
                <li key={item.id}>
                  <div className="mu-esc-top">
                    <a href={`#/project/${item.projectId}`}>{item.projectId} {item.projectName}</a>
                    <span className={item.status === "MoSPI responded" ? "mu-status mu-status-done" : "mu-status mu-status-pending"}>
                      {item.status === "MoSPI responded" ? "✅ MoSPI responded" : "⏳ Pending MoSPI response"}
                    </span>
                  </div>
                  <p>{item.reason}</p>
                  {item.response && <p className="mu-esc-response"><strong>MoSPI:</strong> {item.response}</p>}
                  <time>{item.time}</time>
                </li>
              ))}
            </ul>
          </PanelList>
        )}

        {section === "recovery" && (
          <PanelList title="📋 Recovery Plans" kicker="Plan pipeline">
            <div className="mu-table-plain">
              <table>
                <thead><tr><th>Project</th><th>Submitted</th><th>Status</th></tr></thead>
                <tbody>
                  {config.recoveryPlans.map((plan) => (
                    <tr key={plan.id} className="db-clickable-row" onClick={() => { window.location.hash = `#/project/${plan.projectId}`; }}>
                      <td>{plan.projectId} {plan.projectName}</td>
                      <td>{plan.submitted}</td>
                      <td><span className={`mu-plan-badge mu-plan-${plan.status.toLowerCase().replace(" ", "-")}`}>{plan.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelList>
        )}

        {section === "assistant" && <AllProjectsTable config={config} full />}
      </main>
    </DashboardShell>
  );
}
