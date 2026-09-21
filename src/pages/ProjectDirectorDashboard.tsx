import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Banknote,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Coins,
  Download,
  FileText,
  Flag,
  Gauge,
  ListChecks,
  MessageSquare,
  Receipt,
  Settings,
  Target,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { DashboardShell, type NavItem } from "../components/DashboardShell";
import { readSession, writeSession } from "../data/ministryUser";
import { ProjectTrendChart, type Series } from "./ProjectDetailPage";
import type { RiskLevel } from "../data/projects";
import {
  buildPdDashboard,
  pdCostSeries,
  pdProgressSeries,
  projectOptionFor,
  type FlagTone,
  type PdDashboardData,
} from "../data/projectDirector";

// ─── Risk-aware tokens ───────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = { HIGH: "#dc2626", MEDIUM: "#f59e0b", LOW: "#16a34a" };

function riskTone(risk: RiskLevel) {
  return risk.toLowerCase();
}

// ─── Sidebar scoped to a single project ─────────────────────────────────────

function pdNavItems(projectId: string, section: string): NavItem[] {
  const base = `#/project-director/dashboard/${projectId}`;
  return [
    { icon: ClipboardList, label: "My Project", href: base, active: section === "overview" },
    { icon: TrendingUp, label: "Progress", href: `${base}/progress`, active: section === "progress" },
    { icon: TriangleAlert, label: "Alerts", href: `${base}/alerts`, active: section === "alerts" },
    { icon: ListChecks, label: "Tasks", href: `${base}/tasks`, active: section === "tasks" },
    { icon: MessageSquare, label: "Messages", href: `${base}/messages`, active: section === "messages" },
    { icon: FileText, label: "Reports", href: `${base}/reports`, active: section === "reports" },
    { icon: Settings, label: "Settings", href: `${base}/settings`, active: section === "settings" },
  ];
}

// ─── Building blocks ─────────────────────────────────────────────────────────

function Metric({ icon: Icon, label, value, tone, note }: {
  icon: typeof Coins; label: string; value: string; tone: FlagTone; note?: string;
}) {
  return (
    <div className="pd-metric">
      <div className="pd-metric-head">
        <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
        <span>{label}</span>
        <i className={`pd-flag pd-flag-${tone}`} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Panel({ kicker, title, accent, children, dense }: {
  kicker: string; title: ReactNode; accent: FlagTone | "brand"; children: ReactNode; dense?: boolean;
}) {
  return (
    <article className={`pd-card pd-accent-${accent} ${dense ? "is-dense" : ""}`} data-reveal>
      <span className="pd-card-accent" aria-hidden="true" />
      <div className="pd-card-head">
        <span className="db-card-kicker">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function MilestoneModal({ data, onClose }: { data: PdDashboardData; onClose: () => void }) {
  return (
    <div className="modal-layer">
      <button type="button" className="modal-backdrop is-visible" aria-label="Close dialog" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Update milestone status">
        <header className="modal-head">
          <h3>Update Milestone Status</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <form className="modal-form" onSubmit={(event: FormEvent) => { event.preventDefault(); onClose(); }}>
          <label htmlFor="pd-milestone">Milestone</label>
          <select id="pd-milestone">
            {data.milestones.map((milestone) => (
              <option key={milestone.id}>{milestone.id} — {milestone.status}</option>
            ))}
          </select>
          <label htmlFor="pd-status">New status</label>
          <select id="pd-status"><option>On track</option><option>At risk</option><option>Slipped</option><option>Completed</option></select>
          <label htmlFor="pd-note">Justification</label>
          <textarea id="pd-note" rows={3} placeholder="Explain the revised basis" />
          <button type="submit" className="button button-primary">Save Status</button>
        </form>
      </div>
    </div>
  );
}

function RecoveryModal({ issue, onClose }: { issue: string; onClose: () => void }) {
  return (
    <div className="modal-layer">
      <button type="button" className="modal-backdrop is-visible" aria-label="Close dialog" onClick={onClose} />
      <div className="modal-card modal-wide" role="dialog" aria-modal="true" aria-label="Submit recovery plan">
        <header className="modal-head">
          <h3>Submit Recovery Plan</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <form className="modal-form" onSubmit={(event: FormEvent) => { event.preventDefault(); onClose(); }}>
          <label htmlFor="pd-issue">Issue</label>
          <input id="pd-issue" value={issue} readOnly className="pd-readonly" />
          <label htmlFor="pd-cause">Root cause</label>
          <textarea id="pd-cause" rows={3} required placeholder="Primary driver of the variance" />
          <label htmlFor="pd-actions">Corrective actions</label>
          <textarea id="pd-actions" rows={3} required placeholder="Planned corrective steps" />
          <label htmlFor="pd-timeline">Timeline for recovery</label>
          <input id="pd-timeline" type="date" required />
          <fieldset className="pd-checks">
            <legend>Additional support required</legend>
            {["Funding", "Land Acquisition", "Clearances"].map((label) => (
              <label key={label} className="pd-check"><input type="checkbox" /> {label}</label>
            ))}
            <label className="pd-check"><input type="checkbox" /> Other</label>
            <input className="pd-other" type="text" placeholder="Specify other support" />
          </fieldset>
          <div className="modal-actions">
            <button type="submit" className="button button-primary">Submit to Ministry</button>
            <button type="button" className="button button-outline" onClick={onClose}>Save as Draft</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── A. Banner ───────────────────────────────────────────────────────────────

function PdBanner({ data }: { data: PdDashboardData }) {
  const { project } = data;
  return (
    <section className={`pd-banner risk-tone-${riskTone(project.risk)}`} data-reveal>
      <span className="pd-banner-glow" aria-hidden="true" />
      <div className="pd-banner-copy">
        <p className="db-card-kicker">Project Director workspace</p>
        <h1>{project.id} — {project.name}</h1>
        <p className="pd-banner-sub">
          <span><Flag size={13} aria-hidden="true" /> {project.ministry}</span>
          <span><Target size={13} aria-hidden="true" /> {project.sector}</span>
          <span><CalendarDays size={13} aria-hidden="true" /> {project.location}</span>
        </p>
      </div>
      <div className="pd-banner-right">
        <span className={`detail-risk-pill risk-${riskTone(project.risk)}`}>{project.risk}</span>
        <small>Last Updated: 26 Mar 2026</small>
      </div>
    </section>
  );
}

// ─── B. Risk gauge ───────────────────────────────────────────────────────────

function PdRiskCard({ data }: { data: PdDashboardData }) {
  const { project } = data;
  const [live, setLive] = useState(false);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * project.score;
  const color = RISK_COLOR[project.risk];
  const tone = project.risk === "HIGH" ? "critical" : project.risk === "MEDIUM" ? "warning" : "good";
  const message = project.risk === "HIGH"
    ? "This project is at high risk of cost and time overrun. Immediate action required."
    : project.risk === "MEDIUM"
      ? "Monitor closely — variance is contained but trending."
      : "On track. Delivery and spend remain within approved tolerances.";

  // Sweep the arc in from zero once, right after mount.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLive(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <article className={`pd-card pd-risk-card pd-accent-${tone}`} data-reveal>
      <span className="pd-card-accent" aria-hidden="true" />
      <div className="pd-card-head">
        <span className="db-card-kicker">Live AI risk score</span>
        <h2><Gauge size={18} aria-hidden="true" /> Current Risk Assessment</h2>
      </div>

      <div className="pd-gauge">
        <svg viewBox="0 0 200 200" role="img" aria-label={`Risk score ${project.score.toFixed(2)} — ${project.risk}`}>
          <defs>
            <filter id={`pd-glow-${project.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={color} floodOpacity="0.34" />
            </filter>
          </defs>
          <circle className="pd-gauge-track" cx="100" cy="100" r={radius} />
          <circle
            className="pd-gauge-arc"
            cx="100" cy="100" r={radius}
            stroke={color}
            strokeDasharray={live ? `${dash} ${circumference - dash}` : `0 ${circumference}`}
            filter={`url(#pd-glow-${project.id})`}
          />
        </svg>
        <div className="pd-gauge-center">
          <strong>{project.score.toFixed(2)}</strong>
          <span className={`pd-gauge-level level-${riskTone(project.risk)}`}>{project.risk}</span>
          <small>of 1.00</small>
        </div>
      </div>

      <p className={`pd-risk-message pd-risk-${tone}`}>{message}</p>
    </article>
  );
}

// ─── C. Project details ──────────────────────────────────────────────────────

function PdDetailsCard({ data }: { data: PdDashboardData }) {
  const { project } = data;
  const costTone: FlagTone = data.costChangePct > 20 ? "critical" : data.costChangePct > 10 ? "warning" : "good";
  const gapTone: FlagTone = data.progressGap < -5 ? "critical" : data.progressGap < 0 ? "warning" : "good";
  const delayTone: FlagTone = project.delayMonths > 12 ? "critical" : project.delayMonths > 0 ? "warning" : "good";
  const milestoneRatio = project.milestonesAchieved / project.milestonesPlanned;

  return (
    <article className="pd-card pd-accent-brand" data-reveal>
      <span className="pd-card-accent" aria-hidden="true" />
      <div className="pd-card-head">
        <span className="db-card-kicker">Execution profile</span>
        <h2><ClipboardList size={18} aria-hidden="true" /> Project Details</h2>
      </div>
      <div className="pd-detail-grid">
        <section>
          <h3><Coins size={14} aria-hidden="true" /> Cost Information</h3>
          <Metric icon={Banknote} label="Original Cost" value={`₹${project.originalCost.toLocaleString("en-IN")} Cr`} tone="good" />
          <Metric icon={Receipt} label="Revised Cost" value={`₹${project.revisedCost.toLocaleString("en-IN")} Cr`} tone={costTone} note={`${data.costChangePct > 0 ? "+" : ""}${data.costChangePct}% vs original`} />
          <Metric icon={Wallet} label="Expenditure" value={`₹${project.expenditure.toLocaleString("en-IN")} Cr`} tone={data.financialPct >= 60 ? "good" : "warning"} note={`${data.financialPct}% of revised cost`} />
        </section>
        <section>
          <h3><TrendingUp size={14} aria-hidden="true" /> Progress Information</h3>
          <Metric icon={Gauge} label="Physical Progress" value={`${project.physicalProgress}%`} tone={project.physicalProgress >= 60 ? "good" : "warning"} />
          <Metric icon={Wallet} label="Financial Progress" value={`${data.financialPct}%`} tone={data.financialPct >= 60 ? "good" : "warning"} />
          <Metric icon={TrendingDown} label="Progress Gap" value={`${data.progressGap > 0 ? "+" : ""}${data.progressGap}%`} tone={gapTone} note={data.progressGap < 0 ? "Physical lagging financial" : "Within tolerance"} />
        </section>
        <section>
          <h3><CalendarDays size={14} aria-hidden="true" /> Timeline Information</h3>
          <Metric icon={CalendarCheck2} label="Original Date" value={project.originalCommissioning} tone="good" />
          <Metric icon={CalendarClock} label="Revised Date" value={project.revisedCommissioning} tone={delayTone} note={project.delayMonths ? `+${project.delayMonths} months` : "No change"} />
          <Metric icon={Clock3} label="Current Delay" value={project.delayMonths ? `${project.delayMonths} months` : "On schedule"} tone={delayTone} />
        </section>
        <section>
          <h3><Target size={14} aria-hidden="true" /> Milestones</h3>
          <Metric icon={CheckCircle2} label="Achieved" value={`${project.milestonesAchieved} / ${project.milestonesPlanned}`} tone={milestoneRatio >= 0.6 ? "good" : "warning"} />
          <Metric icon={ListChecks} label="Pending" value={String(data.pendingMilestones)} tone={data.pendingMilestones > 3 ? "warning" : "good"} />
          <Metric icon={TriangleAlert} label="Slipped" value={data.slippedLabels.length ? data.slippedLabels.join(", ") : "None"} tone={data.slippedLabels.length ? "critical" : "good"} />
        </section>
      </div>
    </article>
  );
}

// ─── D. Alert reasons ────────────────────────────────────────────────────────

function PdAlertsCard({ data }: { data: PdDashboardData }) {
  const isHigh = data.project.risk === "HIGH";
  const accent: FlagTone = isHigh ? "critical" : data.project.risk === "MEDIUM" ? "warning" : "good";
  const heading = isHigh
    ? `Why is this project at high risk?`
    : data.project.risk === "MEDIUM"
      ? "What to keep watching"
      : "Why this project is on track";

  return (
    <Panel kicker="Risk signals" accent={accent} title={<><TriangleAlert size={18} aria-hidden="true" /> {heading}</>}>
      <ol className={`pd-issue-list tone-${accent}`}>
        {data.issues.map((issue, index) => (
          <li key={issue.title} className={issue.tone === "critical" ? "is-critical" : "is-warning"}>
            <strong>{index + 1}. {issue.title}</strong>
            <small>{issue.comparison}</small>
            <p><em>Impact:</em> {issue.impact}</p>
          </li>
        ))}
      </ol>
      <button type="button" className="button button-outline"><Download size={15} /> Download Detailed Risk Report</button>
    </Panel>
  );
}

// ─── E. My action items ──────────────────────────────────────────────────────

function PdTasksCard({ data }: { data: PdDashboardData }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const run = (id: string) => setDone((current) => ({ ...current, [id]: true }));
  const accent: FlagTone = data.project.risk === "HIGH" ? "critical" : data.project.risk === "MEDIUM" ? "warning" : "good";

  return (
    <Panel kicker="Your queue" accent={accent} title={<><ListChecks size={18} aria-hidden="true" /> My Action Items</>}>
      <div className="pd-task-groups">
        <section>
          <h3><i className="pd-flag pd-flag-critical" /> Urgent — Due Today / Tomorrow</h3>
          {data.urgent.map((task) => (
            <div className="pd-task-row" key={task.id}>
              <div><span>{task.label}</span><small>{task.due}</small></div>
              <button type="button" className="mu-ghost-btn" onClick={() => run(task.id)}>{done[task.id] ? "Submitted" : task.action}</button>
            </div>
          ))}
        </section>
        <section>
          <h3><i className="pd-flag pd-flag-warning" /> Upcoming — This Week</h3>
          {data.upcoming.map((task) => (
            <div className="pd-task-row" key={task.id}>
              <div><span>{task.label}</span><small>{task.due}</small></div>
              <button type="button" className="mu-ghost-btn" onClick={() => run(task.id)}>{done[task.id] ? "Done" : task.action}</button>
            </div>
          ))}
        </section>
        <section>
          <h3><i className="pd-flag pd-flag-good" /> Completed — Last 7 Days</h3>
          {data.completed.map((task) => (
            <div className="pd-task-row is-muted" key={task.id}>
              <div><span><CheckCircle2 size={13} aria-hidden="true" /> {task.label}</span><small>{task.due}</small></div>
            </div>
          ))}
        </section>
      </div>
      <a className="mu-card-link" href={`#/project-director/dashboard/${data.project.id}/tasks`}>View All Tasks →</a>
    </Panel>
  );
}

// ─── F. Trend charts ─────────────────────────────────────────────────────────

function PdCharts({ data, projectId }: { data: PdDashboardData; projectId: string }) {
  const cost = pdCostSeries(data);
  const progress = pdProgressSeries(data);

  const costSeries: Series[] = [
    { key: "original", label: "Original Cost", color: "#8458b3", values: cost.map((point) => point.original) },
    { key: "revised", label: "Revised Cost", color: "#f59e0b", values: cost.map((point) => point.revised) },
    { key: "expenditure", label: "Expenditure", color: "#16a34a", values: cost.map((point) => point.expenditure) },
  ];

  const progressSeries: Series[] = [
    { key: "physical", label: "Physical Progress", color: "#8458b3", values: progress.map((point) => point.physical) },
    { key: "financial", label: "Financial Progress", color: "#16a34a", values: progress.map((point) => point.financial) },
  ];

  const gap = data.progressGap;
  const gapTone = gap < -3 ? "critical" : gap < 0 ? "warning" : "good";
  const gapText = gap < 0 ? "Physical lagging" : gap > 0 ? "Physical ahead" : "Fully aligned";

  return (
    <div className="pd-charts">
      <ProjectTrendChart
        title="Cost Trend (Last 12 Months)"
        kicker="Financial trajectory"
        labels={cost.map((point) => point.period)}
        series={costSeries}
        max={Math.ceil((data.project.revisedCost * 1.05) / 500) * 500}
        suffix=" Cr"
        chartId={`${projectId}-pd-cost`}
      />
      <div className="pd-chart-wrap">
        <ProjectTrendChart
          title="Progress vs Expenditure (Last 12 Months)"
          kicker="Delivery trajectory"
          labels={progress.map((point) => point.period)}
          series={progressSeries}
          max={100}
          suffix="%"
          chartId={`${projectId}-pd-progress`}
        />
        <p className={`pd-gap-callout tone-${gapTone}`}>
          Gap: {gap > 0 ? "+" : ""}{gap}% ({gapText})
        </p>
      </div>
    </div>
  );
}

// ─── H. Milestone tracker ────────────────────────────────────────────────────

function PdMilestonesCard({ data }: { data: PdDashboardData }) {
  const [open, setOpen] = useState(false);
  const accent: FlagTone = data.slippedLabels.length ? "warning" : "good";
  return (
    <Panel kicker="Delivery tracking" accent={accent} title={<><Target size={18} aria-hidden="true" /> Milestone Tracker</>}>
      <div className="pd-gantt">
        {data.milestones.map((milestone) => (
          <div className={`pd-gantt-row pd-gantt-${milestone.status.toLowerCase().replace(" ", "-")}`} key={milestone.id}>
            <span className="pd-gantt-label">{milestone.id}</span>
            <div className="pd-gantt-track">
              <span className="pd-gantt-fill" style={{ width: `${milestone.progress}%` }} />
            </div>
            <span className="pd-gantt-meta">
              {milestone.status === "Completed" && <CheckCircle2 size={12} aria-hidden="true" />} {milestone.status}
              <small>{milestone.dates}</small>
            </span>
          </div>
        ))}
      </div>
      <button type="button" className="button button-outline" onClick={() => setOpen(true)}>Update Milestone Status</button>
      {open && <MilestoneModal data={data} onClose={() => setOpen(false)} />}
    </Panel>
  );
}

// ─── I. Messages ─────────────────────────────────────────────────────────────

function PdMessagesCard({ data }: { data: PdDashboardData }) {
  const [resolved, setResolved] = useState<Record<string, boolean>>({});
  const open = data.messages.filter((message) => !message.resolved && !resolved[message.id]).length;
  return (
    <Panel kicker="Coordination" accent={open ? "warning" : "good"} title={<><MessageSquare size={18} aria-hidden="true" /> Messages from Ministry / MoSPI</>}>
      <ul className="pd-msg-list">
        {data.messages.map((message) => {
          const isDone = message.resolved || resolved[message.id];
          return (
            <li key={message.id} className={isDone ? "is-resolved" : ""}>
              <div className="pd-msg-head">
                <strong>
                  <i className={`pd-flag pd-flag-${message.urgency === "critical" ? "critical" : message.urgency === "warning" ? "warning" : "good"}`} />
                  {message.sender}
                </strong>
                <time>{message.time}</time>
              </div>
              <p>{message.text}</p>
              <div className="mu-row-actions">
                {isDone
                  ? <span className="pd-resolved"><CheckCircle2 size={12} aria-hidden="true" /> Resolved</span>
                  : <>
                      <button type="button" className="mu-ghost-btn">Reply</button>
                      <button type="button" className="mu-ghost-btn" onClick={() => setResolved((current) => ({ ...current, [message.id]: true }))}>Mark as Done</button>
                    </>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mu-card-actions">
        <a className="mu-card-link" href={`#/project-director/dashboard/${data.project.id}/messages`}>View All Messages →</a>
        <button type="button" className="button button-outline">New Message</button>
      </div>
    </Panel>
  );
}

// ─── G. Bottom actions ───────────────────────────────────────────────────────

function PdActions({ data }: { data: PdDashboardData }) {
  const [open, setOpen] = useState(false);
  // Recovery plan is only visually dominant when the project actually needs one.
  const recoveryClass = data.project.risk === "HIGH" ? "button button-primary" : "button button-outline";

  return (
    <div className="pd-actions">
      <button type="button" className={recoveryClass} onClick={() => setOpen(true)}>
        <ClipboardList size={15} /> Submit Recovery Plan
      </button>
      <button type="button" className="button button-outline"><Flag size={15} /> Update Project Status</button>
      <button type="button" className="button button-outline"><Download size={15} /> Download Project Report</button>
      <button type="button" className="button button-outline"><MessageSquare size={15} /> Contact Ministry</button>
      {open && <RecoveryModal issue={data.recoveryIssue} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProjectDirectorDashboard({ projectId, section = "overview" }: { projectId: string; section?: string }) {
  const data = buildPdDashboard(projectId);
  const option = projectOptionFor(projectId);
  const stored = readSession();
  const effectiveUser = option
    ? stored?.role === "Project Director" && stored.projectId === projectId
      ? stored
      : { role: "Project Director" as const, ministrySlug: null, ministryLabel: option.ministry, projectId, name: "Project Director" }
    : null;

  useEffect(() => {
    if (!option) return;
    const current = readSession();
    if (!current) {
      writeSession({ role: "Project Director", ministrySlug: null, ministryLabel: option.ministry, projectId, name: "Project Director" });
    } else if (current.role === "Project Director" && current.projectId !== projectId) {
      writeSession({ ...current, ministryLabel: option.ministry, projectId });
    }
  }, [option, projectId]);

  useEffect(() => {
    document.title = option ? `${option.label} | PAIMANA-AI` : "Project Dashboard | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, [option]);

  if (!data || !option || !effectiveUser) {
    return (
      <DashboardShell active="dashboard" items={pdNavItems(projectId || "P-12345", section)}>
        <main className="db-main">
          <section className="project-not-found">
            <p className="db-card-kicker">Project workspace</p>
            <h1>Project not found</h1>
            <p>No project workspace exists for this route. Select an assigned project to continue.</p>
            <a className="button button-primary" href="#/auth">Back to Login</a>
          </section>
        </main>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      active="dashboard"
      items={pdNavItems(projectId, section)}
      userOverride={effectiveUser}
      aiContext={`Ask about ${option.label}`}
      aiSuggestions={[`Why is ${projectId} ${data.project.risk.toLowerCase()} risk?`, "What are my pending tasks?", "Show the cost trend"]}
      aiAnswer={(question) => {
        const lower = question.toLowerCase();
        if (lower.includes("risk")) return `${projectId} is at ${data.project.risk} risk (${data.project.score.toFixed(2)}). Leading signal: ${data.issues[0]?.title.toLowerCase()}.`;
        if (lower.includes("task")) return `You have ${data.urgent.length} urgent item(s) and ${data.upcoming.length} upcoming task(s) this week.`;
        if (lower.includes("cost")) return `Revised cost is ₹${data.project.revisedCost.toLocaleString("en-IN")} Cr, ${data.costChangePct}% above the original sanction, with ${data.financialPct}% expended.`;
        return `${option.label} is monitored here. Ask about risk, cost, milestones, or your task list.`;
      }}
    >
      <main className={`db-main pd-main pd-scope-${riskTone(data.project.risk)}`}>
        <PdBanner data={data} />

        {section === "overview" && (
          <>
            <PdRiskCard data={data} />
            <PdDetailsCard data={data} />
            <PdAlertsCard data={data} />
            <PdTasksCard data={data} />
            <PdCharts data={data} projectId={projectId} />
            <PdMilestonesCard data={data} />
            <PdMessagesCard data={data} />
            <PdActions data={data} />
          </>
        )}

        {section === "progress" && (
          <>
            <PdMilestonesCard data={data} />
            <PdCharts data={data} projectId={projectId} />
            <PdActions data={data} />
          </>
        )}

        {section === "alerts" && (<><PdAlertsCard data={data} /><PdActions data={data} /></>)}
        {section === "tasks" && (<><PdTasksCard data={data} /><PdActions data={data} /></>)}
        {section === "messages" && (<><PdMessagesCard data={data} /><PdActions data={data} /></>)}

        {section === "reports" && (
          <Panel kicker="Reporting" accent="brand" title={<><FileText size={18} aria-hidden="true" /> Reports</>}>
            <ul className="pd-msg-list">
              {["Monthly Progress Report — Mar 2026", "Quarterly Review Note — Q4 2025", "Expenditure Certificate — Feb 2026"].map((report) => (
                <li key={report}>
                  <div className="pd-msg-head"><strong><FileText size={13} aria-hidden="true" /> {report}</strong><time>Filed</time></div>
                  <div className="mu-row-actions"><button type="button" className="mu-ghost-btn"><Download size={13} /> Download</button></div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {section === "settings" && (
          <Panel kicker="Preferences" accent="brand" title={<><Settings size={18} aria-hidden="true" /> Settings</>} dense>
            <p className="pd-muted">Notification and escalation preferences for this project are scoped to the assigned Project Director.</p>
            <div className="mu-row-actions">
              <button type="button" className="button button-outline">Manage Notifications</button>
              <button type="button" className="button button-outline">Escalation Contacts</button>
            </div>
          </Panel>
        )}
      </main>
    </DashboardShell>
  );
}
