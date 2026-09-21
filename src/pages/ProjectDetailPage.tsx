import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CircleGauge,
  Clock3,
  Download,
  FileText,
  Flag,
  MapPin,
  Milestone,
  Paperclip,
  SendHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";
import { DashboardShell } from "../components/DashboardShell";
import { projectById, riskClass, riskTone, type ProjectRecord } from "../data/projects";
import { useInView } from "../hooks/usePageMotion";

export type Series = { key: string; label: string; color: string; values: number[] };

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return "";
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1]; const offset = (point.x - previous.x) / 3;
    return `${path} C ${previous.x + offset} ${previous.y}, ${point.x - offset} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function ProjectTrendChart({ title, kicker, labels, series, max, suffix, chartId }: { title: string; kicker: string; labels: string[]; series: Series[]; max: number; suffix: string; chartId: string }) {
  const [ref, inView] = useInView<SVGSVGElement>(0.3);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const W = 650, H = 300, L = 48, R = 625, T = 14, B = 258;
  const chartWidth = R - L, chartHeight = B - T, step = chartWidth / (labels.length - 1);
  const x = (index: number) => L + index * step; const y = (value: number) => B - (value / max) * chartHeight;
  const points = (values: number[]) => values.map((value, index) => ({ x: x(index), y: y(value) }));
  const area = (values: number[]) => { const linePoints = points(values); return `${smoothPath(linePoints)} L ${linePoints.at(-1)?.x} ${B} L ${linePoints[0].x} ${B} Z`; };
  const ticks = Array.from({ length: 5 }, (_, index) => Math.round((max / 4) * index));

  return <article className="detail-chart-card" data-reveal>
    <span className="db-card-kicker">{kicker}</span><h2>{title}</h2>
    <svg ref={ref} className={`detail-chart-svg ${inView ? "is-live" : ""}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <defs>{series.map((item) => <linearGradient key={item.key} id={`${chartId}-${item.key}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={item.color} stopOpacity="0.16" /><stop offset="100%" stopColor={item.color} stopOpacity="0" /></linearGradient>)}</defs>
      {ticks.map((value) => <g key={value}><line className="detail-grid-line" x1={L} y1={y(value)} x2={R} y2={y(value)} /><text x={L - 8} y={y(value) + 4} textAnchor="end" fill="#8a7b87" fontSize="10">{value}{suffix}</text></g>)}
      <line className="detail-axis-line" x1={L} y1={T} x2={L} y2={B} />
      {labels.map((label, index) => <text key={label} x={x(index)} y={B + 18} textAnchor="middle" fill="#8a7b87" fontSize="10">{label}</text>)}
      {series.map((item) => <g key={item.key}><path className="detail-area" d={area(item.values)} fill={`url(#${chartId}-${item.key}-fill)`} /><path className="detail-line" d={smoothPath(points(item.values))} fill="none" stroke={item.color} pathLength="1" />{item.values.map((value, index) => <circle key={index} className="detail-marker" cx={x(index)} cy={y(value)} r="4" fill="#f7f8fc" stroke={item.color} strokeWidth="2" />)}</g>)}
      {hoverIndex !== null && <line className="detail-guide" x1={x(hoverIndex)} y1={T} x2={x(hoverIndex)} y2={B} />}
      {labels.map((_, index) => <rect key={index} x={x(index) - step / 2} y={T} width={step} height={chartHeight} fill="transparent" className="detail-hover-zone" onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(null)} />)}
    </svg>
    {hoverIndex !== null && <div className="detail-chart-tip" style={{ left: `${(x(hoverIndex) / W) * 100}%` }}><strong>{labels[hoverIndex]}</strong>{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}: {item.values[hoverIndex]}{suffix}</span>)}</div>}
    <div className="detail-legend">{series.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>)}</div>
  </article>;
}

function RiskGauge({ project }: { project: ProjectRecord }) {
  const radius = 38; const circumference = 2 * Math.PI * radius; const dash = circumference * project.score;
  const stroke = project.risk === "HIGH" ? "#dc2626" : project.risk === "MEDIUM" ? "#d98a2b" : "#4e9a68";
  return <div className="risk-gauge"><svg viewBox="0 0 96 96" aria-hidden="true"><circle className="risk-gauge-track" cx="48" cy="48" r={radius} /><circle className="risk-gauge-value" cx="48" cy="48" r={radius} stroke={stroke} strokeDasharray={`${dash} ${circumference - dash}`} /></svg><span>{project.score.toFixed(2)}</span></div>;
}

function DetailItem({ icon: Icon, label, value, progress }: { icon: typeof Building2; label: string; value: string; progress?: number }) {
  return <div className="detail-item"><div className="detail-item-head"><Icon size={16} aria-hidden="true" /><span>{label}</span></div><strong>{value}</strong>{progress != null && <div className="detail-progress"><span style={{ width: `${progress}%` }} /></div>}</div>;
}

type ForecastData = {
  projectedCost: number;
  costDelta: number;
  additionalDelay: number;
  newEta: string;
  confidence: number;
  projectedRisk: number;
  improving: boolean;
  driver: string;
  labels: string[];
  actualRisk: number[];
  predictedRisk: number[];
};

function clampScore(value: number) {
  return Math.max(0.03, Math.min(0.98, Number(value.toFixed(2))));
}

function addMonthsToLabel(label: string, months: number) {
  const [month, year] = label.split(" ");
  const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
  if (monthIndex < 0 || !year) return label;
  const date = new Date(Number(year), monthIndex + months, 1);
  return `${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}`;
}

function buildForecast(project: ProjectRecord): ForecastData {
  const improving = project.risk === "LOW" || project.status === "Completed";
  const riskChange = improving ? -0.05 : project.risk === "HIGH" ? 0.09 : 0.07;
  const projectedRisk = clampScore(project.score + riskChange);
  const costIncrease = project.risk === "HIGH" ? 0.2 : project.risk === "MEDIUM" ? 0.1 : 0.04;
  const projectedCost = Math.ceil((project.revisedCost * (1 + costIncrease)) / 50) * 50;
  const costDelta = Math.round(((projectedCost - project.revisedCost) / project.revisedCost) * 100);
  const additionalDelay = project.risk === "HIGH" ? 6 : project.risk === "MEDIUM" ? 3 : project.status === "Completed" ? 0 : 1;
  const confidence = project.risk === "HIGH" ? 78 : project.risk === "MEDIUM" ? 82 : 87;
  const actualStart = improving ? project.score + 0.08 : project.score - (project.risk === "HIGH" ? 0.18 : 0.12);
  const actualRisk = Array.from({ length: 6 }, (_, index) =>
    clampScore(actualStart + ((project.score - actualStart) * index) / 5),
  );
  const predictedRisk = Array.from({ length: 6 }, (_, index) =>
    clampScore(project.score + (projectedRisk - project.score) * Math.min((index + 1) / 3, 1)),
  );

  return {
    projectedCost,
    costDelta,
    additionalDelay,
    newEta: addMonthsToLabel(project.revisedCommissioning, additionalDelay),
    confidence,
    projectedRisk,
    improving,
    driver: improving
      ? "stable delivery progress + controlled cost exposure"
      : project.risk === "HIGH"
        ? "sustained expenditure lag + repeated milestone slippage"
        : "delivery variance + unresolved package dependencies",
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    actualRisk,
    predictedRisk,
  };
}

function ForecastRiskGauge({ forecast }: { forecast: ForecastData }) {
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * forecast.projectedRisk;
  const stroke = forecast.projectedRisk >= 0.6 ? "#dc2626" : forecast.projectedRisk >= 0.3 ? "#d98a2b" : "#4e9a68";

  return <div className="forecast-risk-gauge">
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <circle className="forecast-gauge-track" cx="48" cy="48" r={radius} />
      <circle className="forecast-gauge-value" cx="48" cy="48" r={radius} stroke={stroke} strokeDasharray={`${dash} ${circumference - dash}`} />
    </svg>
    <span>{forecast.projectedRisk.toFixed(2)}</span>
    <small>Predicted</small>
  </div>;
}

function ForecastSparkline({ project, forecast }: { project: ProjectRecord; forecast: ForecastData }) {
  const actual = project.costHistory.slice(-4).map((point) => point.revised);
  const predicted = [project.revisedCost, ...Array.from({ length: 3 }, (_, index) => Math.round(project.revisedCost + ((forecast.projectedCost - project.revisedCost) * (index + 1)) / 3))];
  const all = [...actual, ...predicted.slice(1)];
  const min = Math.min(...all) * 0.97;
  const max = Math.max(...all) * 1.03;
  const x = (index: number) => 8 + index * 25;
  const y = (value: number) => 58 - ((value - min) / Math.max(1, max - min)) * 46;
  const actualPoints = actual.map((value, index) => ({ x: x(index), y: y(value) }));
  const predictedPoints = predicted.map((value, index) => ({ x: x(index + 3), y: y(value) }));

  return <svg className="forecast-sparkline" viewBox="0 0 166 66" role="img" aria-label="Actual and predicted cost trajectory">
    <path className="forecast-spark-actual" d={smoothPath(actualPoints)} />
    <line className="forecast-spark-today" x1={x(3)} x2={x(3)} y1="6" y2="60" />
    <path className="forecast-spark-predicted" d={smoothPath(predictedPoints)} />
    <circle cx={actualPoints.at(-1)?.x} cy={actualPoints.at(-1)?.y} r="3" />
  </svg>;
}

function ForecastRiskChart({ project, forecast }: { project: ProjectRecord; forecast: ForecastData }) {
  const [ref, inView] = useInView<SVGSVGElement>(0.25);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const W = 980, H = 330, L = 52, R = 950, T = 20, B = 282;
  const width = R - L;
  const height = B - T;
  const step = width / (forecast.labels.length - 1);
  const x = (index: number) => L + index * step;
  const y = (value: number) => B - value * height;
  const actualPoints = forecast.actualRisk.map((value, index) => ({ x: x(index), y: y(value) }));
  const predictedValues = [project.score, ...forecast.predictedRisk];
  const predictedPoints = predictedValues.map((value, index) => ({ x: x(index + 5), y: y(value) }));
  const uncertainty = predictedValues.map((_, index) => 0.012 + index * 0.009);
  const upper = predictedValues.map((value, index) => ({ x: x(index + 5), y: y(Math.min(1, value + uncertainty[index])) }));
  const lower = predictedValues.map((value, index) => ({ x: x(index + 5), y: y(Math.max(0, value - uncertainty[index])) })).reverse();
  const confidencePath = `${smoothPath(upper)} L ${lower[0].x} ${lower[0].y} ${smoothPath(lower).replace(/^M [\d.]+ [\d.]+/, "")} Z`;
  const allValues = [...forecast.actualRisk, ...forecast.predictedRisk];
  const todayX = x(5);

  return <div className="forecast-chart-wrap">
    <div className="forecast-chart-head"><div><span className="db-card-kicker">Forward-looking risk model</span><h3>Risk Score Forecast - Next 6 Months</h3></div><div className="forecast-chart-key"><span><i className="actual" />Actual</span><span><i className="predicted" />Predicted</span><span><i className="band" />Confidence</span></div></div>
    <div className="forecast-chart-canvas">
      <svg ref={ref} className={`forecast-chart-svg ${inView ? "is-live" : ""}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Actual and predicted risk score forecast">
        <defs><linearGradient id={`forecast-band-${project.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8458b3" stopOpacity="0.17" /><stop offset="100%" stopColor="#8458b3" stopOpacity="0.05" /></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => <g key={tick}><line className="forecast-grid" x1={L} y1={y(tick)} x2={R} y2={y(tick)} /><text x={L - 9} y={y(tick) + 4} textAnchor="end">{tick.toFixed(2)}</text></g>)}
        <rect className="forecast-future-zone" x={todayX} y={T} width={R - todayX} height={height} />
        <path className="forecast-confidence-band" d={confidencePath} fill={`url(#forecast-band-${project.id})`} />
        <path className="forecast-actual-line" d={smoothPath(actualPoints)} pathLength="1" />
        <path className="forecast-predicted-line" d={smoothPath(predictedPoints)} pathLength="1" />
        <line className="forecast-today-line" x1={todayX} x2={todayX} y1={T} y2={B} />
        <g className="forecast-today-label"><rect x={todayX - 25} y={T + 5} width="50" height="20" rx="4" /><text x={todayX} y={T + 19} textAnchor="middle">Today</text></g>
        {allValues.map((value, index) => <circle key={index} className={`forecast-point ${index > 5 ? "is-predicted" : ""}`} cx={x(index)} cy={y(value)} r="4" />)}
        {hoverIndex !== null && <line className="forecast-hover-guide" x1={x(hoverIndex)} x2={x(hoverIndex)} y1={T} y2={B} />}
        {forecast.labels.map((label, index) => <g key={label}><text className={index > 5 ? "is-predicted" : ""} x={x(index)} y={B + 20} textAnchor="middle">{label}</text><rect className="forecast-hover-zone" x={Math.max(L, x(index) - step / 2)} y={T} width={step} height={height} fill="transparent" onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(null)} /></g>)}
      </svg>
      {hoverIndex !== null && <div className="forecast-tooltip" style={{ left: `clamp(70px, ${(x(hoverIndex) / W) * 100}%, calc(100% - 70px))` }}><span>{forecast.labels[hoverIndex]} · {hoverIndex > 5 ? "Predicted" : "Actual"}</span><strong>{allValues[hoverIndex].toFixed(2)}</strong></div>}
    </div>
  </div>;
}

function FutureRiskPrediction({ project }: { project: ProjectRecord }) {
  const forecast = buildForecast(project);
  const TrendIcon = forecast.improving ? TrendingDown : TrendingUp;
  const trajectoryLabel = forecast.improving ? "Risk trending downward" : "Risk trending upward";
  const thresholdCopy = forecast.projectedRisk >= 0.6
    ? "Without intervention, this project is projected to remain above the HIGH-risk escalation threshold over the next 3 months."
    : forecast.improving
      ? "Current intervention signals indicate risk should continue moving toward a lower monitoring band."
      : "Without intervention, this project is projected to move closer to the HIGH-risk threshold within 3 months.";

  return <section className="forecast-section" data-reveal>
    <div className="forecast-section-head"><p className="db-card-kicker">ML Forecast</p><h2>Where This Project Is Headed</h2><p>Based on current cost, progress, and milestone patterns, our model projects the following over the next 6 months.</p></div>
    <div className="forecast-summary-grid">
      <article className="forecast-metric-card"><div className="forecast-card-label"><span>Predicted cost overrun</span><small>Predicted</small></div><div className="forecast-cost-row"><strong>₹{forecast.projectedCost.toLocaleString("en-IN")} Cr</strong><span>+{forecast.costDelta}% vs revised</span></div><p>Projected Final Cost</p><ForecastSparkline project={project} forecast={forecast} /><div className="forecast-spark-key"><span><i />Actual</span><span><i />Predicted</span></div></article>
      <article className="forecast-metric-card"><div className="forecast-card-label"><span>Schedule forecast</span><small>Predicted</small></div><strong className="forecast-delay">+{forecast.additionalDelay} months</strong><p>Projected Additional Delay</p><div className="forecast-eta"><CalendarDays size={15} /><span>New ETA: <b>{forecast.newEta}</b></span></div><div className="forecast-confidence-head"><span>Model Confidence</span><strong>{forecast.confidence}%</strong></div><div className="forecast-confidence-track"><span style={{ width: `${forecast.confidence}%` }} /></div></article>
      <article className="forecast-metric-card forecast-risk-card"><div className="forecast-card-label"><span>Forecasted risk trajectory</span><small>3 months</small></div><div className="forecast-risk-content"><ForecastRiskGauge forecast={forecast} /><div><span className={`forecast-direction ${forecast.improving ? "improving" : "worsening"}`}><TrendIcon size={16} />{trajectoryLabel}</span><p>Current: {project.score.toFixed(2)}</p></div></div><div className="forecast-driver"><span>Driven by:</span> {forecast.driver}</div></article>
    </div>
    <ForecastRiskChart project={project} forecast={forecast} />
    <div className={`forecast-warning ${forecast.projectedRisk >= 0.6 ? "is-urgent" : ""}`}><TriangleAlert size={18} /><span><strong>Early Warning:</strong> {thresholdCopy}</span></div>
  </section>;
}

type Attachment = { name: string; kind: "image" | "file"; preview?: string };
type ChatMessage = { id: number; from: "ai" | "user"; text: string; sources?: string[] };

function answerFor(question: string, project: ProjectRecord) {
  const lower = question.toLowerCase();
  if (lower.includes("cost")) return `${project.name} is at ₹${project.expenditure.toLocaleString("en-IN")} Cr expenditure against a revised cost of ₹${project.revisedCost.toLocaleString("en-IN")} Cr. The approved cost is ${Math.round(((project.revisedCost - project.originalCost) / project.originalCost) * 100)}% above the original estimate.`;
  if (lower.includes("recovery") || lower.includes("action")) return `Prioritize the delayed critical milestone, assign an owner for each clearance, and review the expenditure-to-progress gap fortnightly. A ${project.delayMonths}-month schedule recovery plan should be submitted before the next flash report.`;
  return `${project.name} is marked ${project.risk.toLowerCase()} risk at ${project.score.toFixed(2)}. The strongest current signals are ${project.alertReasons.slice(0, 2).join(" ")}`;
}

function ProjectAssistant({ project }: { project: ProjectRecord }) {
  const [open, setOpen] = useState(false); const [input, setInput] = useState(""); const [thinking, setThinking] = useState(false); const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 1, from: "ai", text: `I have the latest reporting context for ${project.id}. Ask me about risk, cost, milestones, or recovery actions.`, sources: ["PAIMANA Flash Report, March 2026"] }]);
  const fileInputRef = useRef<HTMLInputElement>(null); const timerRef = useRef<number | null>(null); const nextMessage = useRef(2); const attachmentUrls = useRef<string[]>([]);
  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); attachmentUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);
  const send = (question: string) => {
    const trimmed = question.trim(); if (!trimmed || thinking) return;
    setMessages((current) => [...current, { id: nextMessage.current++, from: "user", text: trimmed }]); setInput(""); setThinking(true);
    timerRef.current = window.setTimeout(() => { setMessages((current) => [...current, { id: nextMessage.current++, from: "ai", text: answerFor(trimmed, project), sources: ["PAIMANA Flash Report, March 2026", "Project milestone ledger"] }]); setThinking(false); }, 1000);
  };
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); const nextFiles = files.map((file): Attachment => { const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined; if (preview) attachmentUrls.current.push(preview); return { name: file.name, kind: file.type.startsWith("image/") ? "image" : "file", preview }; }); setAttachments((current) => [...current, ...nextFiles]); event.target.value = ""; };
  const removeFile = (index: number) => setAttachments((current) => { const next = [...current]; const removed = next.splice(index, 1)[0]; if (removed.preview) { URL.revokeObjectURL(removed.preview); attachmentUrls.current = attachmentUrls.current.filter((url) => url !== removed.preview); } return next; });
  const suggestions = [`Why is ${project.id} ${project.risk.toLowerCase()} risk?`, "Show cost trend", "Suggest recovery actions"];
  return <><button type="button" className="ai-fab" onClick={() => setOpen(true)} aria-label="Open AI Assistant"><Sparkles size={23} /></button><button type="button" className={`ai-chat-backdrop ${open ? "is-visible" : ""}`} aria-label="Close AI Assistant" onClick={() => setOpen(false)} />
    <aside className={`ai-panel ${open ? "is-open" : ""}`} aria-label="AI Assistant" aria-hidden={!open} inert={!open}><header className="ai-panel-head"><div><span className="ai-panel-title"><Sparkles size={17} /> AI Assistant</span><p>Ask about {project.id} - {project.name}</p></div><button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Close AI Assistant"><X size={19} /></button></header>
      <div className="ai-messages">{messages.map((message) => <div className={`ai-message-row ${message.from}`} key={message.id}><div className="ai-message">{message.text}</div>{message.sources && <div className="ai-sources"><span>Sources</span>{message.sources.map((source) => <small key={source}>{source}</small>)}</div>}</div>)}{thinking && <div className="ai-thinking"><i /><i /><i /></div>}</div>
      <footer className="ai-composer"><div className="ai-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}</div>{attachments.length > 0 && <div className="ai-files">{attachments.map((file, index) => <span className="ai-file" key={`${file.name}-${index}`}>{file.preview ? <img src={file.preview} alt="" /> : <FileText size={13} />}{file.name}<button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><X size={12} /></button></span>)}</div>}<form className="ai-input-row" onSubmit={(event: FormEvent) => { event.preventDefault(); send(input); }}><input ref={fileInputRef} className="ai-file-picker" type="file" multiple accept="image/*,.pdf,.doc,.docx" onChange={addFiles} /><button type="button" className="ai-attach" onClick={() => fileInputRef.current?.click()} aria-label="Attach image or document"><Paperclip size={18} /></button><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about this project..." /><button type="submit" className="ai-send" disabled={!input.trim() || thinking} aria-label="Send message"><SendHorizontal size={16} /></button></form></footer>
    </aside></>;
}

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const project = projectById(projectId);
  useEffect(() => { document.title = project ? `${project.name} | PAIMANA-AI` : "Project not found | PAIMANA-AI"; window.scrollTo({ top: 0 }); return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; }; }, [project]);
  if (!project) return <DashboardShell active="projects"><main className="db-main"><section className="project-not-found"><p className="db-card-kicker">Project record</p><h1>Project not found</h1><p>The requested project is not present in the current sample dataset.</p><a className="button button-primary" href="#/projects">Back to Projects</a></section></main></DashboardShell>;
  const milestonePercent = Math.round((project.milestonesAchieved / project.milestonesPlanned) * 100);
  const costSeries: Series[] = [{ key: "original", label: "Original Cost", color: "#8458b3", values: project.costHistory.map((point) => point.original) }, { key: "revised", label: "Revised Cost", color: "#d98a2b", values: project.costHistory.map((point) => point.revised) }, { key: "expenditure", label: "Expenditure", color: "#4e9a68", values: project.costHistory.map((point) => point.expenditure) }];
  const progressSeries: Series[] = [{ key: "physical", label: "Physical Progress", color: "#8458b3", values: project.progressHistory.map((point) => point.physical) }, { key: "financial", label: "Financial Progress", color: "#4e9a68", values: project.progressHistory.map((point) => point.financial) }];
  return <DashboardShell active="projects" noGlobalAI><main className="db-main project-detail-main"><div className="project-breadcrumb"><a href="#/projects">Projects</a><span>/</span><span>{project.id}</span></div><a href="#/projects" className="project-back"><ArrowLeft size={15} /> Back to Projects</a>
    <section className={`project-risk-banner risk-tone-${riskTone(project.risk)}`} data-reveal><div className="project-title-block"><span className={`detail-risk-pill ${riskClass(project.risk)}`}>{project.risk}</span><div><h1>{project.name}</h1><span>{project.id} · {project.status}</span></div></div><div className="project-gauge-block"><span>Live AI risk score</span><RiskGauge project={project} /></div></section>
    <section className="detail-card" data-reveal><div className="detail-card-head"><div><p className="db-card-kicker">Project profile</p><h2>Project Details</h2></div><span className={`project-status ${project.status === "Ongoing" ? "status-ongoing" : project.status === "Completed" ? "status-completed" : "status-stalled"}`}>{project.status}</span></div><div className="detail-grid"><DetailItem icon={Building2} label="Ministry" value={project.ministry} /><DetailItem icon={Flag} label="Sector" value={project.sector} /><DetailItem icon={MapPin} label="Location" value={project.location} /><DetailItem icon={CircleDollarSign} label="Original Cost" value={`₹${project.originalCost.toLocaleString("en-IN")} Cr`} /><DetailItem icon={CircleDollarSign} label="Revised Cost" value={`₹${project.revisedCost.toLocaleString("en-IN")} Cr`} /><DetailItem icon={CircleDollarSign} label="Cumulative Expenditure" value={`₹${project.expenditure.toLocaleString("en-IN")} Cr (${project.expenditurePercent}%)`} progress={project.expenditurePercent} /><DetailItem icon={CircleGauge} label="Physical Progress" value={`${project.physicalProgress}%`} progress={project.physicalProgress} /><DetailItem icon={CalendarDays} label="Commissioning Date (Original)" value={project.originalCommissioning} /><DetailItem icon={CalendarDays} label="Commissioning Date (Revised)" value={project.revisedCommissioning} /><DetailItem icon={Clock3} label="Delay" value={project.delayMonths ? `${project.delayMonths} months` : "On schedule"} /><DetailItem icon={Milestone} label="Milestones" value={`${project.milestonesAchieved} / ${project.milestonesPlanned} achieved`} progress={milestonePercent} /><DetailItem icon={CheckCircle2} label="Project Status" value={project.status} /></div></section>
    <section className={`detail-alert-card risk-tone-${riskTone(project.risk)}`} data-reveal><div><p className="db-card-kicker">Risk signals</p><h2><TriangleAlert size={20} /> Why is this project {project.risk.toLowerCase()} risk?</h2></div><ul>{project.alertReasons.map((reason) => <li key={reason}><TriangleAlert size={16} />{reason}</li>)}</ul></section>
    <FutureRiskPrediction project={project} />
    <section className="detail-charts-row"><ProjectTrendChart title="Cost Over Time" kicker="Financial trajectory" labels={project.costHistory.map((point) => point.period)} series={costSeries} max={Math.ceil(project.revisedCost / 500) * 500} suffix=" Cr" chartId={`${project.id}-cost`} /><ProjectTrendChart title="Progress vs Expenditure" kicker="Delivery trajectory" labels={project.progressHistory.map((point) => point.period)} series={progressSeries} max={100} suffix="%" chartId={`${project.id}-progress`} /></section>
    <div className="detail-actions"><button type="button" className="button button-outline"><Download size={15} /> Download Project Report</button><button type="button" className="button button-primary">Submit Recovery Plan</button><a className="back-link" href="#/projects"><ArrowLeft size={15} /> Back to List</a></div>
  </main><ProjectAssistant key={project.id} project={project} /></DashboardShell>;
}