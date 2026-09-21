import { MINISTRY_STATS } from "./analytics";
import { PROJECTS } from "./projects";

export const ALL_PROJECT_OPTIONS = PROJECTS.map((project) => ({
  id: project.id,
  name: project.name,
  ministry: project.ministry,
  label: `${project.id} — ${project.name}`,
}));

export function projectOptionFor(id: string | null) {
  if (!id) return null;
  return ALL_PROJECT_OPTIONS.find((option) => option.id === id) ?? null;
}

export type FlagTone = "critical" | "warning" | "good";

export interface PdIssue {
  title: string;
  comparison: string;
  impact: string;
  tone: "critical" | "warning";
}

export interface PdTask {
  id: string;
  label: string;
  due: string;
  action: string;
}

export interface PdMilestone {
  id: string;
  label: string;
  status: "Completed" | "Slipped" | "At Risk" | "Pending";
  progress: number;
  dates: string;
}

export interface PdMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  urgency: "critical" | "warning" | "done";
  resolved: boolean;
}

export interface PdDashboardData {
  project: typeof PROJECTS[number];
  sector: string;
  costChangePct: number;
  financialPct: number;
  progressGap: number;
  pendingMilestones: number;
  slippedLabels: string[];
  issues: PdIssue[];
  urgent: PdTask[];
  upcoming: PdTask[];
  completed: PdTask[];
  milestones: PdMilestone[];
  messages: PdMessage[];
  recoveryIssue: string;
}

const METRICS_12 = [0.2, 0.33, 0.46, 0.58, 0.69, 0.78, 0.85, 0.9, 0.94, 0.97, 0.99, 1];
const MONTH_LABELS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

/** Derive a fully populated PD dashboard from any project in the shared dataset. */
export function buildPdDashboard(projectId: string): PdDashboardData | null {
  const project = PROJECTS.find((entry) => entry.id === projectId);
  if (!project) return null;

  const stat = MINISTRY_STATS.find((entry) => entry.name === project.ministry);
  const costChangePct = Math.round(((project.revisedCost - project.originalCost) / project.originalCost) * 100);
  const financialPct = project.expenditurePercent;
  const progressGap = project.physicalProgress - financialPct;

  const critical = project.risk === "HIGH";
  const milestoneSeed = project.milestonesPlanned;
  const pending = milestoneSeed - project.milestonesAchieved;
  const slippedLabels = critical ? ["M3", "M7"] : project.risk === "MEDIUM" ? ["M2"] : [];
  const slipped = slippedLabels.length;

  const fullyCompleted = Math.max(0, project.milestonesAchieved - slipped);
  let completedCount = 0;
  let atRiskPlaced = false;
  const milestones: PdMilestone[] = Array.from({ length: Math.min(milestoneSeed, 8) }, (_, index) => {
    const label = `M${index + 1}`;
    if (slippedLabels.includes(label)) {
      return { id: label, label: `${label} — critical path package`, status: "Slipped", progress: 62, dates: "Mar 2026 → Sep 2026" };
    }
    if (completedCount < fullyCompleted) {
      completedCount += 1;
      return { id: label, label: `${label} — ${stat?.sector ?? project.sector} works`, status: "Completed", progress: 100, dates: "Delivered on schedule" };
    }
    if (!atRiskPlaced) {
      atRiskPlaced = true;
      return { id: label, label: `${label} — current work front`, status: "At Risk", progress: 41, dates: "Due Jun 2026" };
    }
    return { id: label, label: `${label} — planned scope`, status: "Pending", progress: 0, dates: "Scheduled" };
  });

  const issues: PdIssue[] = critical
    ? [
        {
          title: "Cost overrun beyond sanction threshold",
          comparison: `Original ₹${project.originalCost.toLocaleString("en-IN")} Cr vs Revised ₹${project.revisedCost.toLocaleString("en-IN")} Cr (+${costChangePct}%)`,
          impact: "Requires a revised administrative approval before further commitment.",
          tone: "critical",
        },
        {
          title: "Expenditure lagging the physical plan",
          comparison: `Planned 78% vs Actual ${financialPct}% at this stage`,
          impact: "Cash flow shortfall is slowing the critical path packages.",
          tone: "critical",
        },
        {
          title: "Repeated milestone slippage",
          comparison: `${slippedLabels.join(", ")} slipped across consecutive reports`,
          impact: "Commissioning risk compounds with every slipped review cycle.",
          tone: "critical",
        },
        {
          title: "Timeline extension already booked",
          comparison: `${project.originalCommissioning} → ${project.revisedCommissioning} (+${project.delayMonths} months)`,
          impact: "Any further slip moves the delivery beyond the approved window.",
          tone: "warning",
        },
      ]
    : project.risk === "MEDIUM"
      ? [
          { title: "Moderate cost variance", comparison: `Original ₹${project.originalCost.toLocaleString("en-IN")} Cr vs Revised ₹${project.revisedCost.toLocaleString("en-IN")} Cr (+${costChangePct}%)`, impact: "Within tolerance, but should be monitored at each review.", tone: "warning" },
          { title: "Single milestone slipping", comparison: `${slippedLabels.join(", ")} is behind its target date`, impact: "Recoverable within the current quarter.", tone: "warning" },
        ]
      : [
          { title: "Delivery on plan", comparison: `Physical ${project.physicalProgress}% vs Financial ${financialPct}%`, impact: "No intervention required at this stage.", tone: "warning" },
        ];

  // Task load scales with risk — a healthy project only carries routine reporting.
  const urgent: PdTask[] = critical
    ? [
        { id: "T1", label: "Submit revised cost justification to Ministry", due: "Due today", action: "Submit Now" },
        { id: "T2", label: `Update milestone ${slippedLabels[0] ?? "M3"} recovery status`, due: "Due tomorrow", action: "Update Status" },
      ]
    : project.risk === "MEDIUM"
      ? [{ id: "T1", label: "Confirm revised milestone dates with the contractor", due: "Due tomorrow", action: "Update Status" }]
      : [{ id: "T1", label: "Submit routine monthly progress report", due: "Due tomorrow", action: "Submit Now" }];

  const upcoming: PdTask[] = critical
    ? [
        { id: "U1", label: "Respond to Ministry clarification on land status", due: "Due in 3 days", action: "Respond" },
        { id: "U2", label: "Upload contractor progress annexures", due: "Due in 5 days", action: "Upload Report" },
      ]
    : project.risk === "MEDIUM"
      ? [
          { id: "U1", label: "Respond to the quarterly review questionnaire", due: "Due in 4 days", action: "Respond" },
          { id: "U2", label: "Upload updated expenditure annexure", due: "Due in 6 days", action: "Upload Report" },
        ]
      : [
          { id: "U1", label: "Upload quarterly expenditure certificate", due: "Due in 5 days", action: "Upload Report" },
          { id: "U2", label: "Confirm the next site inspection window", due: "Due in 6 days", action: "Respond" },
        ];

  const completed: PdTask[] = [
    { id: "C1", label: "Monthly physical progress entry filed", due: "2 days ago", action: "Done" },
    { id: "C2", label: "Quality audit walkthrough completed", due: "4 days ago", action: "Done" },
    ...(critical ? [] : [{ id: "C3", label: "Site safety compliance checklist submitted", due: "6 days ago", action: "Done" }]),
  ];

  const messages: PdMessage[] = critical
    ? [
        { id: "M1", sender: `${project.ministry} Desk`, time: "3 hours ago", text: "Please share the revised cost memo ahead of the review committee.", urgency: "critical", resolved: false },
        { id: "M2", sender: "MoSPI IPMD", time: "1 day ago", text: "Clarify the recovery sequence for the slipped milestones.", urgency: "warning", resolved: false },
        { id: "M3", sender: `${project.ministry} Desk`, time: "5 days ago", text: "Quarterly review slot confirmed. Acknowledge receipt.", urgency: "done", resolved: true },
      ]
    : [
        { id: "M1", sender: `${project.ministry} Desk`, time: "1 day ago", text: "Progress noted. Continue on the current sequence.", urgency: "done", resolved: true },
      ];

  return {
    project,
    sector: project.sector,
    costChangePct,
    financialPct,
    progressGap,
    pendingMilestones: pending,
    slippedLabels,
    issues,
    urgent,
    upcoming,
    completed,
    milestones,
    messages,
    recoveryIssue: `Cost Overrun — ${costChangePct}% above original sanction`,
  };
}

/** 12-month cost trend series scaled from the project's sanctioned values. */
export function pdCostSeries(data: PdDashboardData) {
  const { project } = data;
  return METRICS_12.map((factor, index) => ({
    period: MONTH_LABELS[index],
    original: project.originalCost,
    revised: Math.round(project.originalCost + (project.revisedCost - project.originalCost) * factor),
    expenditure: Math.round(project.expenditure * factor),
  }));
}

/**
 * 12-month physical vs financial progress series. Divergence is derived from the
 * project's own end-state gap, so healthy projects show closely tracking lines
 * while high-risk projects visibly fan apart.
 */
export function pdProgressSeries(data: PdDashboardData) {
  const { project } = data;
  const spread = project.risk === "HIGH" ? 1 : project.risk === "MEDIUM" ? 0.5 : 0.2;
  return METRICS_12.map((factor, index) => {
    const drift = (project.physicalProgress - project.expenditurePercent) * spread * (1 - factor);
    return {
      period: MONTH_LABELS[index],
      physical: Math.max(3, Math.round(project.physicalProgress * factor + drift)),
      financial: Math.max(2, Math.round(project.expenditurePercent * factor)),
    };
  });
}
