export const SECTORS = [
  "Rail",
  "Power",
  "Road",
  "Defence",
  "Energy",
  "Water",
  "Coal",
  "Steel",
  "Telecom",
  "Urban",
] as const;

export const MINISTRIES = [
  "Railways",
  "Power",
  "Road Transport",
  "Defence",
  "New & Renewable Energy",
  "Jal Shakti",
  "Coal",
  "Steel",
  "Telecommunications",
  "Housing & Urban Affairs",
  "Civil Aviation",
  "Ports, Shipping & Waterways",
  "Petroleum & Natural Gas",
  "Heavy Industries",
  "Mines",
  "Chemicals & Fertilizers",
  "Health & Family Welfare",
] as const;

export type Sector = (typeof SECTORS)[number];
export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";
export type ProjectStatus = "Ongoing" | "Completed" | "Stalled";

export interface ProjectRecord {
  id: string;
  name: string;
  ministry: string;
  sector: Sector;
  risk: RiskLevel;
  score: number;
  status: ProjectStatus;
  location: string;
  originalCost: number;
  revisedCost: number;
  expenditure: number;
  expenditurePercent: number;
  physicalProgress: number;
  originalCommissioning: string;
  revisedCommissioning: string;
  delayMonths: number;
  milestonesAchieved: number;
  milestonesPlanned: number;
  alertReasons: string[];
  costHistory: { period: string; original: number; revised: number; expenditure: number }[];
  progressHistory: { period: string; physical: number; financial: number }[];
}

type ProjectSeed = Omit<
  ProjectRecord,
  "costHistory" | "progressHistory" | "expenditurePercent"
> & {
  expenditurePercent?: number;
};

const reportPeriods = ["Apr", "Jun", "Aug", "Oct", "Dec", "Mar"];

function withHistory(seed: ProjectSeed): ProjectRecord {
  const financialPercent = seed.expenditurePercent ?? Math.round((seed.expenditure / seed.revisedCost) * 100);
  const physicalSteps = [
    Math.max(4, seed.physicalProgress - 38),
    Math.max(8, seed.physicalProgress - 29),
    Math.max(12, seed.physicalProgress - 20),
    Math.max(16, seed.physicalProgress - 13),
    Math.max(20, seed.physicalProgress - 7),
    seed.physicalProgress,
  ];
  const financialSteps = [
    Math.max(3, financialPercent - 35),
    Math.max(6, financialPercent - 26),
    Math.max(10, financialPercent - 18),
    Math.max(15, financialPercent - 11),
    Math.max(19, financialPercent - 5),
    financialPercent,
  ];

  return {
    ...seed,
    expenditurePercent: financialPercent,
    costHistory: reportPeriods.map((period, index) => ({
      period,
      original: seed.originalCost,
      revised: index < 2 ? seed.originalCost : Math.round(seed.originalCost + (seed.revisedCost - seed.originalCost) * ((index - 1) / 4)),
      expenditure: Math.round(seed.expenditure * ([0.19, 0.33, 0.48, 0.64, 0.82, 1][index])),
    })),
    progressHistory: reportPeriods.map((period, index) => ({
      period,
      physical: physicalSteps[index],
      financial: financialSteps[index],
    })),
  };
}

export const PROJECTS: ProjectRecord[] = [
  withHistory({
    id: "P-12345", name: "XYZ Rail Project", ministry: "Railways", sector: "Rail", risk: "HIGH", score: 0.82, status: "Ongoing", location: "Maharashtra - Gujarat", originalCost: 2500, revisedCost: 3200, expenditure: 1984, expenditurePercent: 62, physicalProgress: 58, originalCommissioning: "Dec 2024", revisedCommissioning: "Jun 2026", delayMonths: 18, milestonesAchieved: 8, milestonesPlanned: 12,
    alertReasons: ["Expenditure is 18% behind the approved plan.", "Milestone M3 has slipped twice in consecutive reports.", "Cost was revised twice in the last 12 months.", "Commissioning timeline has extended by 18 months."],
  }),
  withHistory({
    id: "P-23456", name: "ABC Power Project", ministry: "Power", sector: "Power", risk: "HIGH", score: 0.78, status: "Ongoing", location: "Uttar Pradesh", originalCost: 1850, revisedCost: 2240, expenditure: 1277, physicalProgress: 51, originalCommissioning: "Mar 2025", revisedCommissioning: "Jan 2027", delayMonths: 22, milestonesAchieved: 6, milestonesPlanned: 11,
    alertReasons: ["Physical progress is 14% below the recovery schedule.", "Land handover for the transmission corridor remains incomplete.", "Two procurement packages have been retendered.", "Cost escalation has crossed the 20% review threshold."],
  }),
  withHistory({
    id: "P-34567", name: "DEF Road Project", ministry: "Road Transport", sector: "Road", risk: "HIGH", score: 0.75, status: "Stalled", location: "Rajasthan", originalCost: 1460, revisedCost: 1785, expenditure: 1071, physicalProgress: 54, originalCommissioning: "Sep 2024", revisedCommissioning: "May 2026", delayMonths: 20, milestonesAchieved: 7, milestonesPlanned: 12,
    alertReasons: ["Monsoon damage requires rework on two stretches.", "Expenditure is 12% ahead of physical progress.", "Utility shifting has delayed three critical packages.", "Timeline has been revised by 20 months."],
  }),
  withHistory({
    id: "P-45678", name: "GHI Defence Proj", ministry: "Defence", sector: "Defence", risk: "HIGH", score: 0.73, status: "Ongoing", location: "Ladakh", originalCost: 980, revisedCost: 1230, expenditure: 787, physicalProgress: 49, originalCommissioning: "Jun 2025", revisedCommissioning: "Mar 2027", delayMonths: 21, milestonesAchieved: 5, milestonesPlanned: 10,
    alertReasons: ["Weather window constraints affected two work seasons.", "Material deliveries are below the monthly target.", "Revised estimate is pending final approval.", "Physical progress remains below the 50% milestone."],
  }),
  withHistory({
    id: "P-56789", name: "JKL Energy Proj", ministry: "New & Renewable Energy", sector: "Energy", risk: "HIGH", score: 0.71, status: "Ongoing", location: "Tamil Nadu", originalCost: 760, revisedCost: 950, expenditure: 599, physicalProgress: 56, originalCommissioning: "Aug 2025", revisedCommissioning: "Apr 2026", delayMonths: 8, milestonesAchieved: 6, milestonesPlanned: 10,
    alertReasons: ["Grid connectivity approval has slipped by two quarters.", "Solar module delivery is below committed schedule.", "Revised cost remains 25% above original sanction.", "Financial progress outpaces physical execution."],
  }),
  withHistory({
    id: "P-67890", name: "MNO Water Proj", ministry: "Jal Shakti", sector: "Water", risk: "HIGH", score: 0.69, status: "Ongoing", location: "Bihar", originalCost: 640, revisedCost: 815, expenditure: 482, physicalProgress: 47, originalCommissioning: "Jul 2024", revisedCommissioning: "Dec 2026", delayMonths: 29, milestonesAchieved: 4, milestonesPlanned: 9,
    alertReasons: ["Floodplain clearance is pending for two pumping stations.", "Physical progress is 12% below the planned trajectory.", "Contractor mobilization has been delayed twice.", "Commissioning date has moved by 29 months."],
  }),
  withHistory({
    id: "P-78901", name: "PQR Coal Proj", ministry: "Coal", sector: "Coal", risk: "HIGH", score: 0.67, status: "Stalled", location: "Jharkhand", originalCost: 520, revisedCost: 640, expenditure: 410, physicalProgress: 52, originalCommissioning: "Jan 2025", revisedCommissioning: "Nov 2026", delayMonths: 22, milestonesAchieved: 5, milestonesPlanned: 9,
    alertReasons: ["Environmental clearance conditions are not fully met.", "Mine access road remains incomplete.", "Expenditure has stalled for two reporting cycles.", "Cost revision is awaiting funding approval."],
  }),
  withHistory({
    id: "P-89012", name: "STU Steel Proj", ministry: "Steel", sector: "Steel", risk: "HIGH", score: 0.65, status: "Ongoing", location: "Odisha", originalCost: 1120, revisedCost: 1340, expenditure: 898, physicalProgress: 61, originalCommissioning: "Nov 2024", revisedCommissioning: "Sep 2026", delayMonths: 22, milestonesAchieved: 7, milestonesPlanned: 11,
    alertReasons: ["Critical equipment commissioning is six months late.", "Raw material linkage is yet to be finalized.", "Cost has risen due to imported equipment variation.", "Two key milestones remain open after target date."],
  }),
  withHistory({
    id: "P-90123", name: "VWX Rail Project", ministry: "Railways", sector: "Rail", risk: "HIGH", score: 0.63, status: "Ongoing", location: "West Bengal", originalCost: 1380, revisedCost: 1560, expenditure: 967, physicalProgress: 59, originalCommissioning: "Feb 2025", revisedCommissioning: "Oct 2026", delayMonths: 20, milestonesAchieved: 8, milestonesPlanned: 12,
    alertReasons: ["Bridge package progress remains below plan.", "Land acquisition is unresolved in one district.", "Expenditure is 9% behind the sanctioned timeline.", "Latest risk score rose for three consecutive reports."],
  }),
  withHistory({
    id: "P-01234", name: "YZA Power Project", ministry: "Power", sector: "Power", risk: "HIGH", score: 0.61, status: "Ongoing", location: "Madhya Pradesh", originalCost: 890, revisedCost: 1065, expenditure: 693, physicalProgress: 57, originalCommissioning: "Apr 2025", revisedCommissioning: "Jan 2027", delayMonths: 21, milestonesAchieved: 6, milestonesPlanned: 10,
    alertReasons: ["Transformer delivery has slipped by 14 weeks.", "Financial closure for one package remains unresolved.", "Civil works are below recovery schedule.", "Revised commissioning date exceeds original plan by 21 months."],
  }),
  withHistory({
    id: "P-11223", name: "Eastern Link Road Upgrade", ministry: "Road Transport", sector: "Road", risk: "MEDIUM", score: 0.52, status: "Ongoing", location: "Assam", originalCost: 710, revisedCost: 775, expenditure: 481, physicalProgress: 64, originalCommissioning: "Dec 2025", revisedCommissioning: "Jun 2026", delayMonths: 6, milestonesAchieved: 8, milestonesPlanned: 11,
    alertReasons: ["Utility relocation remains 10% behind plan.", "Two work packages require monsoon recovery action."],
  }),
  withHistory({
    id: "P-22334", name: "Northern Grid Expansion", ministry: "Power", sector: "Power", risk: "MEDIUM", score: 0.48, status: "Ongoing", location: "Haryana", originalCost: 675, revisedCost: 720, expenditure: 468, physicalProgress: 69, originalCommissioning: "Oct 2025", revisedCommissioning: "Mar 2026", delayMonths: 5, milestonesAchieved: 8, milestonesPlanned: 10,
    alertReasons: ["Right-of-way approval remains pending on one line section.", "Substation testing requires an accelerated completion plan."],
  }),
  withHistory({
    id: "P-33445", name: "Yamuna Rail Bridge", ministry: "Railways", sector: "Rail", risk: "MEDIUM", score: 0.45, status: "Ongoing", location: "Delhi", originalCost: 430, revisedCost: 465, expenditure: 302, physicalProgress: 72, originalCommissioning: "Jun 2025", revisedCommissioning: "Dec 2025", delayMonths: 6, milestonesAchieved: 9, milestonesPlanned: 11,
    alertReasons: ["River diversion approval delayed a foundation package.", "Expenditure is marginally ahead of physical completion."],
  }),
  withHistory({
    id: "P-44556", name: "IOP Water Supply Scheme", ministry: "Jal Shakti", sector: "Water", risk: "MEDIUM", score: 0.42, status: "Ongoing", location: "Karnataka", originalCost: 360, revisedCost: 390, expenditure: 245, physicalProgress: 67, originalCommissioning: "Mar 2026", revisedCommissioning: "Aug 2026", delayMonths: 5, milestonesAchieved: 7, milestonesPlanned: 10,
    alertReasons: ["Pipeline right-of-way is incomplete in two village clusters.", "Pump procurement lead time is above planned duration."],
  }),
  withHistory({
    id: "P-55667", name: "ASD Border Infrastructure", ministry: "Defence", sector: "Defence", risk: "MEDIUM", score: 0.39, status: "Ongoing", location: "Arunachal Pradesh", originalCost: 585, revisedCost: 620, expenditure: 403, physicalProgress: 74, originalCommissioning: "Sep 2025", revisedCommissioning: "Feb 2026", delayMonths: 5, milestonesAchieved: 9, milestonesPlanned: 12,
    alertReasons: ["High-altitude logistics are affecting final surfacing work.", "Winter closure may constrain the remaining milestones."],
  }),
  withHistory({
    id: "P-66778", name: "FGH Solar Park", ministry: "New & Renewable Energy", sector: "Energy", risk: "LOW", score: 0.22, status: "Completed", location: "Rajasthan", originalCost: 340, revisedCost: 345, expenditure: 339, physicalProgress: 98, originalCommissioning: "Dec 2025", revisedCommissioning: "Dec 2025", delayMonths: 0, milestonesAchieved: 10, milestonesPlanned: 10,
    alertReasons: ["No critical warning signals in the latest reporting cycle."],
  }),
  withHistory({
    id: "P-77889", name: "JKL Wind Farm", ministry: "New & Renewable Energy", sector: "Energy", risk: "LOW", score: 0.18, status: "Ongoing", location: "Gujarat", originalCost: 410, revisedCost: 420, expenditure: 365, physicalProgress: 88, originalCommissioning: "Aug 2026", revisedCommissioning: "Aug 2026", delayMonths: 0, milestonesAchieved: 9, milestonesPlanned: 10,
    alertReasons: ["Progress remains aligned with the approved delivery schedule."],
  }),
  withHistory({
    id: "P-88990", name: "ZXC Coal Washery", ministry: "Coal", sector: "Coal", risk: "LOW", score: 0.15, status: "Ongoing", location: "Chhattisgarh", originalCost: 285, revisedCost: 290, expenditure: 236, physicalProgress: 84, originalCommissioning: "Nov 2026", revisedCommissioning: "Nov 2026", delayMonths: 0, milestonesAchieved: 8, milestonesPlanned: 9,
    alertReasons: ["Current cost and construction trajectories are within tolerance."],
  }),
  withHistory({
    id: "P-99001", name: "VBN Steel Plant Modernisation", ministry: "Steel", sector: "Steel", risk: "LOW", score: 0.12, status: "Ongoing", location: "Chhattisgarh", originalCost: 760, revisedCost: 770, expenditure: 623, physicalProgress: 82, originalCommissioning: "Mar 2027", revisedCommissioning: "Mar 2027", delayMonths: 0, milestonesAchieved: 8, milestonesPlanned: 10,
    alertReasons: ["No material delay or cost overrun indicators are present."],
  }),
  withHistory({
    id: "P-00112", name: "NML Road Tunnel", ministry: "Road Transport", sector: "Road", risk: "LOW", score: 0.09, status: "Ongoing", location: "Himachal Pradesh", originalCost: 1050, revisedCost: 1080, expenditure: 799, physicalProgress: 79, originalCommissioning: "Oct 2026", revisedCommissioning: "Dec 2026", delayMonths: 2, milestonesAchieved: 9, milestonesPlanned: 11,
    alertReasons: ["Schedule variance is below the early-warning threshold."],
  }),
  withHistory({
    id: "P-12034", name: "National Optical Fibre Extension", ministry: "Telecommunications", sector: "Telecom", risk: "MEDIUM", score: 0.34, status: "Ongoing", location: "Pan-India", originalCost: 1240, revisedCost: 1315, expenditure: 761, physicalProgress: 62, originalCommissioning: "Dec 2026", revisedCommissioning: "Apr 2027", delayMonths: 4, milestonesAchieved: 7, milestonesPlanned: 11,
    alertReasons: ["Last-mile right-of-way permissions remain open in four circles.", "Financial progress is marginally ahead of cable-laying progress."],
  }),
];

export const projectById = (id: string) => PROJECTS.find((project) => project.id === id);

export function riskClass(risk: RiskLevel) {
  return risk === "HIGH" ? "risk-high" : risk === "MEDIUM" ? "risk-medium" : "risk-low";
}

export function riskTone(risk: RiskLevel) {
  return risk.toLowerCase();
}