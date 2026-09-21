// Shared static data for Analytics, Alerts, and Ministries pages.
// All figures are internally consistent with the portfolio totals:
// 1,981 total projects, 210 High, 540 Medium, 1,231 Low, across 17 ministries.

export const MINISTRY_STATS = [
  { name: "Railways",                icon: "🚆", total: 412, high: 45, medium: 122, low: 245, avgScore: 0.41, trend: +4.2, sector: "Rail" },
  { name: "Power",                   icon: "⚡", total: 386, high: 60, medium: 104, low: 222, avgScore: 0.44, trend: +2.8, sector: "Power" },
  { name: "Road Transport",          icon: "🛣",  total: 298, high: 35, medium: 87,  low: 176, avgScore: 0.36, trend: -1.3, sector: "Road" },
  { name: "Jal Shakti",             icon: "💧", total: 178, high: 15, medium: 54,  low: 109, avgScore: 0.24, trend: +0.9, sector: "Water" },
  { name: "Coal",                    icon: "⛏",  total: 142, high: 12, medium: 38,  low: 92,  avgScore: 0.21, trend: -2.1, sector: "Coal" },
  { name: "Steel",                   icon: "🏗",  total: 110, high: 8,  medium: 29,  low: 73,  avgScore: 0.18, trend: -0.7, sector: "Steel" },
  { name: "Defence",                 icon: "🛡",  total: 245, high: 28, medium: 66,  low: 151, avgScore: 0.33, trend: +1.6, sector: "Defence" },
  { name: "New & Renewable Energy",  icon: "☀",  total: 210, high: 22, medium: 58,  low: 130, avgScore: 0.29, trend: -3.4, sector: "Energy" },
  { name: "Telecommunications",      icon: "📡", total: 98,  high: 9,  medium: 31,  low: 58,  avgScore: 0.26, trend: +0.5, sector: "Telecom" },
  { name: "Housing & Urban Affairs", icon: "🏙",  total: 136, high: 14, medium: 42,  low: 80,  avgScore: 0.30, trend: +1.1, sector: "Urban" },
  { name: "Civil Aviation",          icon: "✈",  total: 62,  high: 6,  medium: 18,  low: 38,  avgScore: 0.22, trend: -0.4, sector: "Rail" },
  { name: "Ports, Shipping & Waterways", icon: "🚢", total: 47, high: 4, medium: 14, low: 29, avgScore: 0.19, trend: +0.2, sector: "Water" },
  { name: "Petroleum & Natural Gas", icon: "🛢",  total: 84,  high: 7,  medium: 26,  low: 51,  avgScore: 0.23, trend: +1.8, sector: "Energy" },
  { name: "Heavy Industries",        icon: "🏭", total: 53,  high: 5,  medium: 16,  low: 32,  avgScore: 0.20, trend: -0.6, sector: "Steel" },
  { name: "Mines",                   icon: "⛰",  total: 48,  high: 4,  medium: 15,  low: 29,  avgScore: 0.17, trend: -1.0, sector: "Coal" },
  { name: "Chemicals & Fertilizers", icon: "🧪", total: 38,  high: 3,  medium: 11,  low: 24,  avgScore: 0.15, trend: +0.3, sector: "Energy" },
  { name: "Health & Family Welfare", icon: "🏥", total: 34,  high: 2,  medium: 9,   low: 23,  avgScore: 0.12, trend: -0.1, sector: "Urban" },
] as const;

export type MinistryStats = (typeof MINISTRY_STATS)[number];

export const SECTOR_DISTRIBUTION = [
  { sector: "Rail",    high: 57, medium: 142, low: 213 },
  { sector: "Power",   high: 68, medium: 130, low: 188 },
  { sector: "Road",    high: 42, medium: 103, low: 155 },
  { sector: "Defence", high: 34, medium: 81,  low: 130 },
  { sector: "Energy",  high: 25, medium: 69,  low: 116 },
  { sector: "Water",   high: 19, medium: 68,  low: 138 },
  { sector: "Coal",    high: 16, medium: 53,  low: 121 },
  { sector: "Steel",   high: 13, medium: 42,  low: 95  },
];

export const SECTOR_AVG_SCORES = [
  { sector: "Rail",    score: 0.42 },
  { sector: "Power",   score: 0.44 },
  { sector: "Road",    score: 0.37 },
  { sector: "Defence", score: 0.34 },
  { sector: "Energy",  score: 0.30 },
  { sector: "Water",   score: 0.26 },
  { sector: "Coal",    score: 0.23 },
  { sector: "Steel",   score: 0.20 },
];

export const COST_ESCALATION_DRIVERS = [
  { label: "Land Acquisition Delays",   pct: 34 },
  { label: "Material Cost Inflation",   pct: 28 },
  { label: "Contractual Disputes",      pct: 18 },
  { label: "Regulatory Clearances",     pct: 12 },
  { label: "Design Changes",            pct: 8  },
];

export type AlertSeverity = "HIGH" | "MEDIUM";
export type AlertSource   = "Detected" | "Predicted";

export interface AlertRecord {
  id: string;
  projectId: string;
  projectName: string;
  ministry: string;
  sector: string;
  severity: AlertSeverity;
  source: AlertSource;
  reason: string;
  timestamp: string;     // ISO-ish label we render as relative
  relativeTime: string;
  read: boolean;
}

export const ALERTS: AlertRecord[] = [
  { id: "A-001", projectId: "P-12345", projectName: "XYZ Rail Project",          ministry: "Railways",            sector: "Rail",   severity: "HIGH",   source: "Detected",  reason: "Expenditure lag crossed 18% threshold — immediate review required.",         timestamp: "2026-03-26T08:12:00", relativeTime: "2 hours ago",     read: false },
  { id: "A-002", projectId: "P-23456", projectName: "ABC Power Project",          ministry: "Power",               sector: "Power",  severity: "HIGH",   source: "Detected",  reason: "Milestone M3 slipped for the second consecutive report period.",              timestamp: "2026-03-26T05:45:00", relativeTime: "5 hours ago",     read: false },
  { id: "A-003", projectId: "P-34567", projectName: "DEF Road Project",           ministry: "Road Transport",      sector: "Road",   severity: "HIGH",   source: "Detected",  reason: "Cost was revised twice in the last 12 months, crossing 20% overrun.",         timestamp: "2026-03-26T02:30:00", relativeTime: "8 hours ago",     read: true  },
  { id: "A-004", projectId: "P-45678", projectName: "GHI Defence Proj",           ministry: "Defence",             sector: "Defence",severity: "HIGH",   source: "Predicted", reason: "ML model forecasts risk score will exceed 0.80 within 30 days.",              timestamp: "2026-03-26T01:10:00", relativeTime: "9 hours ago",     read: false },
  { id: "A-005", projectId: "P-56789", projectName: "JKL Energy Proj",            ministry: "New & Renewable Energy", sector: "Energy", severity: "MEDIUM", source: "Detected", reason: "Grid connectivity approval has slipped by two consecutive quarters.",        timestamp: "2026-03-25T18:00:00", relativeTime: "14 hours ago",    read: false },
  { id: "A-006", projectId: "P-67890", projectName: "MNO Water Proj",             ministry: "Jal Shakti",          sector: "Water",  severity: "HIGH",   source: "Detected",  reason: "Physical progress is 12% below planned trajectory for this reporting period.", timestamp: "2026-03-25T14:22:00", relativeTime: "Yesterday",       read: true  },
  { id: "A-007", projectId: "P-78901", projectName: "PQR Coal Proj",              ministry: "Coal",                sector: "Coal",   severity: "HIGH",   source: "Predicted", reason: "Expenditure stalled for two consecutive cycles — stall likely to persist.",    timestamp: "2026-03-25T11:05:00", relativeTime: "Yesterday",       read: true  },
  { id: "A-008", projectId: "P-89012", projectName: "STU Steel Proj",             ministry: "Steel",               sector: "Steel",  severity: "MEDIUM", source: "Detected",  reason: "Equipment commissioning delayed six months beyond milestone target.",          timestamp: "2026-03-25T09:44:00", relativeTime: "Yesterday",       read: false },
  { id: "A-009", projectId: "P-90123", projectName: "VWX Rail Project",           ministry: "Railways",            sector: "Rail",   severity: "MEDIUM", source: "Predicted", reason: "Risk score has risen for three consecutive reports; upward trend projected.",  timestamp: "2026-03-24T16:30:00", relativeTime: "2 days ago",      read: true  },
  { id: "A-010", projectId: "P-01234", projectName: "YZA Power Project",          ministry: "Power",               sector: "Power",  severity: "HIGH",   source: "Detected",  reason: "Revised commissioning date now exceeds original plan by more than 18 months.", timestamp: "2026-03-24T10:15:00", relativeTime: "2 days ago",      read: true  },
  { id: "A-011", projectId: "P-11223", projectName: "Eastern Link Road Upgrade",  ministry: "Road Transport",      sector: "Road",   severity: "MEDIUM", source: "Detected",  reason: "Utility relocation remains 10% behind plan ahead of monsoon season.",         timestamp: "2026-03-23T13:00:00", relativeTime: "3 days ago",      read: true  },
  { id: "A-012", projectId: "P-22334", projectName: "Northern Grid Expansion",    ministry: "Power",               sector: "Power",  severity: "MEDIUM", source: "Predicted", reason: "Substation testing at risk of slipping beyond the current quarter.",          timestamp: "2026-03-22T09:30:00", relativeTime: "4 days ago",      read: true  },
  { id: "A-013", projectId: "P-33445", projectName: "Yamuna Rail Bridge",         ministry: "Railways",            sector: "Rail",   severity: "MEDIUM", source: "Detected",  reason: "River diversion approval remains unresolved, blocking a critical package.",    timestamp: "2026-03-21T11:00:00", relativeTime: "5 days ago",      read: true  },
  { id: "A-014", projectId: "P-44556", projectName: "IOP Water Supply Scheme",    ministry: "Jal Shakti",          sector: "Water",  severity: "MEDIUM", source: "Detected",  reason: "Pump procurement lead time now 40% above the planned delivery duration.",      timestamp: "2026-03-20T15:45:00", relativeTime: "6 days ago",      read: true  },
  { id: "A-015", projectId: "P-55667", projectName: "ASD Border Infrastructure",  ministry: "Defence",             sector: "Defence",severity: "MEDIUM", source: "Predicted", reason: "Winter closure season may prevent milestone completion within this quarter.",   timestamp: "2026-03-19T08:00:00", relativeTime: "This week",       read: true  },
];
