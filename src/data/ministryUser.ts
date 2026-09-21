import { MINISTRY_STATS } from "./analytics";

/** National baseline used for every "vs national average" comparison. */
export const NATIONAL = {
  total: 1981,
  high: 210,
  medium: 540,
  low: 1231,
  highPct: 10.6,
  mediumPct: 27.3,
  lowPct: 62.1,
};

/** The 17 selectable ministries, each with a URL slug for ministry-scoped routes. */
export const AUTH_MINISTRIES = [
  { slug: "railways", label: "Railways" },
  { slug: "power", label: "Power" },
  { slug: "road-transport", label: "Road Transport" },
  { slug: "defence", label: "Defence" },
  { slug: "new-renewable-energy", label: "New & Renewable Energy" },
  { slug: "water", label: "Water Resources" },
  { slug: "coal", label: "Coal" },
  { slug: "steel", label: "Steel" },
  { slug: "telecommunications", label: "Telecommunications" },
  { slug: "housing-urban-affairs", label: "Housing & Urban Affairs" },
  { slug: "civil-aviation", label: "Civil Aviation" },
  { slug: "ports-shipping-waterways", label: "Ports, Shipping & Waterways" },
  { slug: "petroleum-natural-gas", label: "Petroleum & Natural Gas" },
  { slug: "heavy-industries", label: "Heavy Industries" },
  { slug: "mines", label: "Mines" },
  { slug: "chemicals-fertilizers", label: "Chemicals & Fertilizers" },
  { slug: "health-family-welfare", label: "Health & Family Welfare" },
];

export type UserRole = "MoSPI Admin" | "Ministry User" | "Project Director";

export interface SessionUser {
  role: UserRole;
  ministrySlug: string | null;
  ministryLabel: string | null;
  projectId: string | null;
  name: string;
}

export const PD_ROUTE_PREFIX = "#/project-director/dashboard";

export function projectDirectorRoute(projectId: string) {
  return `${PD_ROUTE_PREFIX}/${projectId}`;
}

const SESSION_KEY = "paimana.session";

export function readSession(): SessionUser | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function writeSession(user: SessionUser) {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — session simply is not persisted */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function ministryLabelFor(slug: string | null) {
  return AUTH_MINISTRIES.find((entry) => entry.slug === slug)?.label ?? null;
}

/** Demo accounts exposed on the login card. */
export const DEMO_ACCOUNTS = [
  { user: "mospi_admin", pass: "admin123", role: "MoSPI Admin" as UserRole, scope: "National view" },
  { user: "railways_user", pass: "ministry123", role: "Ministry User" as UserRole, scope: "Railways" },
  { user: "water_user", pass: "ministry123", role: "Ministry User" as UserRole, scope: "Water Resources" },
  { user: "pd_12345", pass: "director123", role: "Project Director" as UserRole, scope: "P-12345 — XYZ Rail Project" },
  { user: "pd_23456", pass: "director123", role: "Project Director" as UserRole, scope: "P-23456 — ABC Power Project" },
];

export function dashboardRouteFor(user: SessionUser) {
  if (user.role === "Ministry User" && user.ministrySlug) return `#/dashboard/${user.ministrySlug}`;
  if (user.role === "Project Director" && user.projectId) return projectDirectorRoute(user.projectId);
  return "#/dashboard";
}

// ─── Ministry dashboard dataset ───────────────────────────────────────────────

export interface MinistrySectorRow {
  sector: string;
  projects: number;
  high: number;
}

export interface AttentionProject {
  id: string;
  name: string;
  score: number;
  sector: string;
  issue: string;
  hasRecoveryPlan: boolean;
}

export interface ActionItem {
  id: string;
  label: string;
  due: string;
  tone: "overdue" | "today" | "soon";
  href: string;
}

export interface EscalationRecord {
  id: string;
  projectId: string;
  projectName: string;
  reason: string;
  status: "Pending MoSPI response" | "MoSPI responded";
  response?: string;
  time: string;
}

export interface RecoveryPlanRecord {
  id: string;
  projectId: string;
  projectName: string;
  submitted: string;
  status: "Pending Approval" | "Approved" | "Overdue";
}

export interface MinistryProject {
  id: string;
  name: string;
  sector: string;
  risk: "HIGH" | "MEDIUM" | "LOW";
  score: number;
  hasRecoveryPlan: boolean;
}

export interface MinistryUserConfig {
  slug: string;
  name: string;
  officialLabel: string;
  icon: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  sectors: MinistrySectorRow[];
  attention: AttentionProject[];
  reviewMeetings: ActionItem[];
  recoveryApprovals: ActionItem[];
  escalationsFromMospi: ActionItem[];
  escalations: EscalationRecord[];
  recoveryPlans: RecoveryPlanRecord[];
  projects: MinistryProject[];
}

const RAILWAYS: MinistryUserConfig = {
  slug: "railways",
  name: "Railways",
  officialLabel: "Railways Official",
  icon: "🚆",
  total: 245,
  high: 45,
  medium: 98,
  low: 102,
  sectors: [
    { sector: "Broad Gauge", projects: 110, high: 22 },
    { sector: "Metro", projects: 61, high: 6 },
    { sector: "Freight Corridor", projects: 49, high: 15 },
    { sector: "Others", projects: 25, high: 2 },
  ],
  attention: [
    { id: "P-12345", name: "XYZ Rail Project", score: 0.82, sector: "Rail", issue: "Expenditure 18% behind plan with a repeated M3 milestone slip.", hasRecoveryPlan: true },
    { id: "P-90123", name: "VWX Rail Project", score: 0.63, sector: "Rail", issue: "Bridge package below plan and land acquisition unresolved.", hasRecoveryPlan: false },
    { id: "P-33521", name: "Dadri Freight Bypass", score: 0.61, sector: "Freight Corridor", issue: "Two contract packages retendered, pushing commissioning out.", hasRecoveryPlan: false },
    { id: "P-33588", name: "Nagpur Metro Extension", score: 0.58, sector: "Metro", issue: "Rolling-stock delivery slipped 14 weeks against schedule.", hasRecoveryPlan: false },
    { id: "P-33640", name: "Ranchi Doubling Works", score: 0.55, sector: "Broad Gauge", issue: "Utility shifting blocking three critical work fronts.", hasRecoveryPlan: true },
  ],
  reviewMeetings: [
    { id: "RM-1", label: "P-12345 XYZ Rail Project — quarterly review", due: "Overdue by 3 days", tone: "overdue", href: "#/project/P-12345" },
    { id: "RM-2", label: "P-33521 Dadri Freight Bypass — cost variance review", due: "Due today", tone: "today", href: "#/project/P-12345" },
    { id: "RM-3", label: "P-33588 Nagpur Metro Extension — milestone audit", due: "Due in 4 days", tone: "soon", href: "#/project/P-12345" },
    { id: "RM-4", label: "P-33640 Ranchi Doubling Works — land status review", due: "Due in 9 days", tone: "soon", href: "#/project/P-12345" },
  ],
  recoveryApprovals: [
    { id: "RA-1", label: "P-33640 Ranchi Doubling Works — plan v2", due: "Awaiting your approval", tone: "overdue", href: "#/project/P-12345" },
    { id: "RA-2", label: "P-33445 Yamuna Rail Bridge — revised sequence", due: "Due in 2 days", tone: "today", href: "#/project/P-12345" },
    { id: "RA-3", label: "P-33712 Patna Rail Yard — phased recovery", due: "Due in 6 days", tone: "soon", href: "#/project/P-12345" },
  ],
  escalationsFromMospi: [
    { id: "EM-1", label: "P-12345 XYZ Rail Project — MoSPI response received", due: "Action requested", tone: "today", href: "#/project/P-12345" },
    { id: "EM-2", label: "P-33640 Ranchi Doubling Works — clarification sought", due: "Due in 3 days", tone: "soon", href: "#/project/P-12345" },
  ],
  escalations: [
    { id: "E-101", projectId: "P-12345", projectName: "XYZ Rail Project", reason: "Cost overrun beyond the 20% ministry threshold — central funding support requested.", status: "MoSPI responded", response: "MoSPI advised a revised cost memo before the next review cycle.", time: "6 hours ago" },
    { id: "E-102", projectId: "P-33640", projectName: "Ranchi Doubling Works", reason: "Land acquisition deadlock across 2 districts needs central coordination.", status: "Pending MoSPI response", time: "2 days ago" },
    { id: "E-103", projectId: "P-90123", projectName: "VWX Rail Project", reason: "Bridge package stalled beyond 6 months — escalation raised for redesign support.", status: "Pending MoSPI response", time: "5 days ago" },
  ],
  recoveryPlans: [
    { id: "RP-201", projectId: "P-12345", projectName: "XYZ Rail Project", submitted: "Submitted 12 Mar 2026", status: "Pending Approval" },
    { id: "RP-202", projectId: "P-33640", projectName: "Ranchi Doubling Works", submitted: "Submitted 18 Mar 2026", status: "Pending Approval" },
    { id: "RP-203", projectId: "P-33445", projectName: "Yamuna Rail Bridge", submitted: "Approved 04 Mar 2026", status: "Approved" },
    { id: "RP-204", projectId: "P-33712", projectName: "Patna Rail Yard", submitted: "Approved 22 Feb 2026", status: "Approved" },
    { id: "RP-205", projectId: "P-33521", projectName: "Dadri Freight Bypass", submitted: "Due 30 Nov 2025", status: "Overdue" },
    { id: "RP-206", projectId: "P-33588", projectName: "Nagpur Metro Extension", submitted: "Due 15 Jan 2026", status: "Overdue" },
  ],
  projects: [
    { id: "P-12345", name: "XYZ Rail Project", sector: "Rail", risk: "HIGH", score: 0.82, hasRecoveryPlan: true },
    { id: "P-90123", name: "VWX Rail Project", sector: "Rail", risk: "HIGH", score: 0.63, hasRecoveryPlan: false },
    { id: "P-33445", name: "Yamuna Rail Bridge", sector: "Metro", risk: "MEDIUM", score: 0.45, hasRecoveryPlan: true },
    { id: "P-33521", name: "Dadri Freight Bypass", sector: "Freight Corridor", risk: "HIGH", score: 0.61, hasRecoveryPlan: false },
    { id: "P-33588", name: "Nagpur Metro Extension", sector: "Metro", risk: "HIGH", score: 0.58, hasRecoveryPlan: false },
    { id: "P-33640", name: "Ranchi Doubling Works", sector: "Broad Gauge", risk: "MEDIUM", score: 0.55, hasRecoveryPlan: true },
    { id: "P-33712", name: "Patna Rail Yard", sector: "Broad Gauge", risk: "MEDIUM", score: 0.48, hasRecoveryPlan: true },
    { id: "P-33778", name: "Surat Freight Terminal", sector: "Freight Corridor", risk: "MEDIUM", score: 0.44, hasRecoveryPlan: false },
    { id: "P-33811", name: "Kochi Metro Phase 3", sector: "Metro", risk: "LOW", score: 0.21, hasRecoveryPlan: false },
    { id: "P-33854", name: "Lucknow Gauge Conversion", sector: "Broad Gauge", risk: "LOW", score: 0.17, hasRecoveryPlan: false },
    { id: "P-33890", name: "Bhopal signalling Upgrade", sector: "Broad Gauge", risk: "LOW", score: 0.12, hasRecoveryPlan: false },
    { id: "P-33925", name: "Goa Track Renewal", sector: "Others", risk: "LOW", score: 0.09, hasRecoveryPlan: false },
  ],
};

const WATER: MinistryUserConfig = {
  slug: "water",
  name: "Water Resources",
  officialLabel: "Water Resources Official",
  icon: "💧",
  total: 78,
  high: 6,
  medium: 22,
  low: 50,
  sectors: [
    { sector: "Irrigation", projects: 32, high: 5 },
    { sector: "River Basin Development", projects: 18, high: 2 },
    { sector: "Urban Water Supply", projects: 19, high: 1 },
    { sector: "Flood Management", projects: 9, high: 0 },
  ],
  attention: [
    { id: "P-67890", name: "MNO Water Proj", score: 0.69, sector: "Water", issue: "Floodplain clearance pending for two pumping stations.", hasRecoveryPlan: false },
    { id: "P-44556", name: "IOP Water Supply Scheme", score: 0.42, sector: "Water", issue: "Right-of-way incomplete in two village clusters.", hasRecoveryPlan: false },
    { id: "P-41220", name: "Godavari Basin Lift Scheme", score: 0.39, sector: "River Basin Development", issue: "Pump procurement lead time above planned duration.", hasRecoveryPlan: false },
    { id: "P-41277", name: "Prayagraj Canal Modernisation", score: 0.34, sector: "Irrigation", issue: "Command-area works lagging the approved sequence.", hasRecoveryPlan: false },
    { id: "P-41330", name: "Patna Flood Embankment", score: 0.28, sector: "Flood Management", issue: "Seasonal window constrains remaining embankment work.", hasRecoveryPlan: false },
  ],
  reviewMeetings: [
    { id: "RM-1", label: "P-67890 MNO Water Proj — clearance review", due: "Due today", tone: "today", href: "#/project/P-67890" },
    { id: "RM-2", label: "P-41220 Godavari Basin Lift Scheme — procurement check", due: "Due in 5 days", tone: "soon", href: "#/project/P-67890" },
    { id: "RM-3", label: "P-41330 Patna Flood Embankment — pre-monsoon review", due: "Due in 11 days", tone: "soon", href: "#/project/P-67890" },
  ],
  recoveryApprovals: [
    { id: "RA-1", label: "P-41277 Prayagraj Canal Modernisation — plan v1", due: "Due in 3 days", tone: "soon", href: "#/project/P-67890" },
  ],
  escalationsFromMospi: [
    { id: "EM-1", label: "P-67890 MNO Water Proj — MoSPI response received", due: "Action requested", tone: "today", href: "#/project/P-67890" },
  ],
  escalations: [
    { id: "E-301", projectId: "P-67890", projectName: "MNO Water Proj", reason: "Central clearance support requested for floodplain pumping stations.", status: "MoSPI responded", response: "MoSPI arranged an inter-departmental clearance meeting.", time: "1 day ago" },
    { id: "E-302", projectId: "P-41220", projectName: "Godavari Basin Lift Scheme", reason: "Equipment procurement timeline escalated for central rate contract.", status: "Pending MoSPI response", time: "4 days ago" },
  ],
  recoveryPlans: [
    { id: "RP-401", projectId: "P-41277", projectName: "Prayagraj Canal Modernisation", submitted: "Submitted 20 Mar 2026", status: "Pending Approval" },
    { id: "RP-402", projectId: "P-44556", projectName: "IOP Water Supply Scheme", submitted: "Approved 28 Feb 2026", status: "Approved" },
    { id: "RP-403", projectId: "P-67890", projectName: "MNO Water Proj", submitted: "Approved 14 Feb 2026", status: "Approved" },
  ],
  projects: [
    { id: "P-67890", name: "MNO Water Proj", sector: "River Basin Development", risk: "HIGH", score: 0.69, hasRecoveryPlan: true },
    { id: "P-41220", name: "Godavari Basin Lift Scheme", sector: "River Basin Development", risk: "MEDIUM", score: 0.39, hasRecoveryPlan: false },
    { id: "P-41277", name: "Prayagraj Canal Modernisation", sector: "Irrigation", risk: "MEDIUM", score: 0.34, hasRecoveryPlan: false },
    { id: "P-41330", name: "Patna Flood Embankment", sector: "Flood Management", risk: "MEDIUM", score: 0.28, hasRecoveryPlan: false },
    { id: "P-44556", name: "IOP Water Supply Scheme", sector: "Urban Water Supply", risk: "MEDIUM", score: 0.42, hasRecoveryPlan: true },
    { id: "P-41388", name: "Bhadravati Lift Irrigation", sector: "Irrigation", risk: "LOW", score: 0.19, hasRecoveryPlan: false },
    { id: "P-41422", name: "Kolar Drinking Water Grid", sector: "Urban Water Supply", risk: "LOW", score: 0.15, hasRecoveryPlan: false },
    { id: "P-41460", name: "Sone Canal Rehabilitation", sector: "Irrigation", risk: "LOW", score: 0.11, hasRecoveryPlan: false },
    { id: "P-41495", name: "Kerala Flood Shelter Network", sector: "Flood Management", risk: "LOW", score: 0.08, hasRecoveryPlan: false },
  ],
};

/** Build a usable config for ministries that do not have a bespoke dataset yet. */
function deriveConfig(slug: string): MinistryUserConfig {
  const label = ministryLabelFor(slug) ?? "Unknown Ministry";
  const stat = MINISTRY_STATS.find((entry) => entry.name === label);
  const total = stat?.total ?? 40;
  const high = stat?.high ?? 4;
  const medium = stat?.medium ?? 14;
  const low = stat?.low ?? total - high - medium;
  const primary = stat?.sector ?? "Urban";

  return {
    slug,
    name: label,
    officialLabel: `${label} Official`,
    icon: stat?.icon ?? "🏛",
    total,
    high,
    medium,
    low,
    sectors: [
      { sector: primary, projects: Math.round(total * 0.5), high: Math.round(high * 0.5) },
      { sector: "Secondary Works", projects: Math.round(total * 0.3), high: Math.round(high * 0.3) },
      { sector: "Others", projects: total - Math.round(total * 0.8), high: high - Math.round(high * 0.8) },
    ],
    attention: [
      { id: "P-00001", name: `${label} Priority Works`, score: 0.58, sector: primary, issue: "Awaiting detailed recovery scheduling from the field unit.", hasRecoveryPlan: false },
    ],
    reviewMeetings: [{ id: "RM-1", label: `${label} portfolio review`, due: "Due in 7 days", tone: "soon", href: "#/dashboard" }],
    recoveryApprovals: [],
    escalationsFromMospi: [],
    escalations: [{ id: "E-501", projectId: "P-00001", projectName: `${label} Priority Works`, reason: "Sample escalation record for this ministry.", status: "Pending MoSPI response", time: "3 days ago" }],
    recoveryPlans: [{ id: "RP-501", projectId: "P-00001", projectName: `${label} Priority Works`, submitted: "Submitted 10 Mar 2026", status: "Pending Approval" }],
    projects: [
      { id: "P-00001", name: `${label} Priority Works`, sector: primary, risk: "HIGH", score: 0.58, hasRecoveryPlan: false },
      { id: "P-00002", name: `${label} Secondary Package`, sector: "Secondary Works", risk: "MEDIUM", score: 0.41, hasRecoveryPlan: false },
      { id: "P-00003", name: `${label} Routine Works`, sector: "Others", risk: "LOW", score: 0.14, hasRecoveryPlan: false },
    ],
  };
}

const BESPOKE: Record<string, MinistryUserConfig> = { railways: RAILWAYS, water: WATER };

export function ministryConfig(slug: string): MinistryUserConfig | null {
  if (BESPOKE[slug]) return BESPOKE[slug];
  return AUTH_MINISTRIES.some((entry) => entry.slug === slug) ? deriveConfig(slug) : null;
}

export function pct(value: number, total: number) {
  return total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
}
