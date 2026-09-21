import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Paperclip,
  Radar,
  SendHorizontal,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { clearSession, readSession, type SessionUser } from "../data/ministryUser";
import { useScrollReveal } from "../hooks/usePageMotion";

export type NavKey = "dashboard" | "projects" | "analytics" | "alerts" | "ministries";

export interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
}

const moSPIItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#/dashboard" },
  { icon: BarChart3, label: "Projects", href: "#/projects" },
  { icon: TrendingUp, label: "Analytics", href: "#/analytics" },
  { icon: Bell, label: "Alerts", href: "#/alerts", badge: 7 },
  { icon: Building2, label: "Ministries", href: "#/ministries" },
  { icon: MessageSquare, label: "AI Assistant", href: "#/dashboard" },
];

/** Sidebar scoped to a single-ministry official — no cross-ministry navigation. */
export function ministryNavItems(slug: string, section: string): NavItem[] {
  const base = `#/dashboard/${slug}`;
  return [
    { icon: LayoutDashboard, label: "Dashboard", href: base, active: section === "overview" },
    { icon: BarChart3, label: "My Projects", href: `${base}/projects`, active: section === "projects" },
    { icon: Bell, label: "Alerts", href: `${base}/alerts`, active: section === "alerts" },
    { icon: ClipboardList, label: "Escalations", href: `${base}/escalations`, active: section === "escalations" },
    { icon: ClipboardList, label: "Recovery Plans", href: `${base}/recovery`, active: section === "recovery" },
    { icon: MessageSquare, label: "AI Assistant", href: `${base}/assistant` },
  ];
}

function DashBrand() {
  return (
    <a href="#/" className="brand-mark" aria-label="PAIMANA-AI home">
      <Radar size={22} strokeWidth={1.8} aria-hidden="true" />
      <span>PAIMANA-AI</span>
    </a>
  );
}

function DashSidebar({ active, open, onClose, items, settingsHref }: { active: NavKey; open: boolean; onClose: () => void; items: NavItem[]; settingsHref?: string }) {
  const hasSettingsInNav = items.some((item) => item.label === "Settings");
  return (
    <aside className={`db-sidebar ${open ? "db-sidebar-open" : ""}`} aria-label="Dashboard navigation">
      <div className="db-sidebar-head">
        <DashBrand />
        <button className="db-sidebar-close" type="button" onClick={onClose} aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>
      <nav className="db-sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = Boolean(item.active) || (!items.some((entry) => entry.active) && items.indexOf(item) === 0 && active === "dashboard");
          return (
            <a key={item.label} href={item.href} className={`db-nav-item ${isActive ? "is-active" : ""}`} aria-current={isActive ? "page" : undefined} onClick={onClose}>
              <Icon size={19} strokeWidth={1.7} />
              <span className="db-nav-label">{item.label}</span>
              {item.badge != null && <span className="db-nav-badge">{item.badge}</span>}
            </a>
          );
        })}
      </nav>
      {!hasSettingsInNav && (
        <nav className="db-sidebar-foot">
          <a href={settingsHref ?? "#/dashboard"} className="db-nav-item" onClick={onClose}>
            <Settings size={19} strokeWidth={1.7} />
            <span className="db-nav-label">Settings</span>
          </a>
        </nav>
      )}
    </aside>
  );
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

function DashHeader({ onMenuOpen, user }: { onMenuOpen: () => void; user: SessionUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const name = user.role === "Project Director"
    ? `Project Director — ${user.projectId ?? ""}`
    : user.role === "Ministry User"
      ? `${user.ministryLabel ?? "Ministry"} Official`
      : "MoSPI Admin";
  const role = user.role === "Project Director"
    ? "Project Director"
    : user.role === "Ministry User"
      ? `Ministry User · ${user.ministryLabel ?? ""}`.trim()
      : user.role;

  useEffect(() => {
    const close = () => setMenuOpen(false);
    if (!menuOpen) return;
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [menuOpen]);

  return (
    <header className="db-header">
      <button className="db-hamburger" type="button" onClick={onMenuOpen} aria-label="Open sidebar">
        <Menu size={22} />
      </button>
      <DashBrand />
      <div className="db-header-right">
        <div className="db-user-menu-wrap">
          <button type="button" className="db-user" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span className="db-avatar">{initialsFor(name)}</span>
            <span className="db-user-info">
              <span className="db-user-name">{name}</span>
              <span className="db-user-role">{role}</span>
            </span>
            <ChevronDown className="db-user-chevron" size={14} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="db-user-menu" role="menu">
              <span className="db-user-menu-label">Signed in as</span>
              <strong>{name}</strong>
              <span className="db-user-menu-role">{role}</span>
              {user.ministryLabel && <span className="db-user-menu-ministry">{user.ministryLabel}</span>}
              <a href="#/auth" role="menuitem" onClick={() => { clearSession(); setMenuOpen(false); }}>Switch account</a>
            </div>
          )}
        </div>
        <a href="#/auth" className="db-logout" onClick={clearSession}>
          <LogOut size={16} /> Logout
        </a>
      </div>
    </header>
  );
}

type ChatMsg = { id: number; from: "ai" | "user"; text: string; sources?: string[] };

function GlobalAI({ contextLabel, suggestions, answer, autoOpen }: { contextLabel: string; suggestions: string[]; answer: (question: string) => string; autoOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(autoOpen));
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, from: "ai", text: "I have the latest reporting context. Ask me anything about risk, cost, or delivery.", sources: ["PAIMANA Flash Report, March 2026"] },
  ]);
  const nextId = useRef(2);
  const timer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((current) => [...current, { id: nextId.current++, from: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    timer.current = window.setTimeout(() => {
      setMessages((current) => [...current, { id: nextId.current++, from: "ai", text: answer(trimmed), sources: ["PAIMANA Flash Report, March 2026"] }]);
      setThinking(false);
    }, 900);
  };

  return (
    <>
      <button type="button" className="ai-fab" onClick={() => setOpen(true)} aria-label="Open AI Assistant">
        <Sparkles size={23} />
      </button>
      <button type="button" className={`ai-chat-backdrop ${open ? "is-visible" : ""}`} aria-label="Close AI Assistant" onClick={() => setOpen(false)} />
      <aside className={`ai-panel ${open ? "is-open" : ""}`} aria-label="AI Assistant" aria-hidden={!open} inert={!open}>
        <header className="ai-panel-head">
          <div>
            <span className="ai-panel-title"><Sparkles size={17} /> AI Assistant</span>
            <p>{contextLabel}</p>
          </div>
          <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Close AI Assistant"><X size={19} /></button>
        </header>
        <div className="ai-messages">
          {messages.map((message) => (
            <div className={`ai-message-row ${message.from}`} key={message.id}>
              <div className="ai-message">{message.text}</div>
              {message.sources && <div className="ai-sources"><span>Sources</span>{message.sources.map((source) => <small key={source}>{source}</small>)}</div>}
            </div>
          ))}
          {thinking && <div className="ai-thinking"><i /><i /><i /></div>}
        </div>
        <footer className="ai-composer">
          <div className="ai-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}</div>
          <form className="ai-input-row" onSubmit={(event: FormEvent) => { event.preventDefault(); send(input); }}>
            <input ref={fileRef} className="ai-file-picker" type="file" multiple accept="image/*,.pdf,.doc,.docx" />
            <button type="button" className="ai-attach" onClick={() => fileRef.current?.click()} aria-label="Attach file"><Paperclip size={18} /></button>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." />
            <button type="submit" className="ai-send" disabled={!input.trim() || thinking} aria-label="Send message"><SendHorizontal size={16} /></button>
          </form>
        </footer>
      </aside>
    </>
  );
}

const PORTFOLIO_SUGGESTIONS = [
  "Which ministry has the highest risk?",
  "Summarise the top cost-overrun drivers",
  "List projects projected to escalate",
];

function portfolioAnswer(question: string) {
  const lower = question.toLowerCase();
  if (lower.includes("ministry")) return "Power leads on average risk score at 0.44 across 386 projects, with Railways second at 0.41 across 412 projects.";
  if (lower.includes("cost") || lower.includes("overrun")) return "The dominant escalation drivers are land acquisition delays (34%), material cost inflation (28%), and contractual disputes (18%).";
  if (lower.includes("escalate") || lower.includes("forecast")) return "P-12345, P-23456, and P-45678 are projected to cross the HIGH-risk threshold within 30 days.";
  return "I can answer questions about ministry performance, sector risk, cost escalation, and flagged projects across the 1,981-project national portfolio.";
}

export function DashboardShell({
  active,
  children,
  noGlobalAI,
  items,
  settingsHref,
  userOverride,
  aiContext,
  aiSuggestions,
  aiAnswer,
  autoOpenAI,
}: {
  active: NavKey;
  children: ReactNode;
  noGlobalAI?: boolean;
  items?: NavItem[];
  settingsHref?: string;
  userOverride?: SessionUser;
  aiContext?: string;
  aiSuggestions?: string[];
  aiAnswer?: (question: string) => string;
  autoOpenAI?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const motionRootRef = useScrollReveal();
  const stored = readSession();
  const user = userOverride ?? stored ?? { role: "MoSPI Admin", ministrySlug: null, ministryLabel: null, projectId: null, name: "MoSPI Admin" };
  const navItems = items ?? moSPIItems.map((item) => ({ ...item, active: item.label.toLowerCase().replace(" ", "-") === active }));

  return (
    <div ref={motionRootRef} className="db-layout">
      <DashSidebar active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} items={navItems} settingsHref={settingsHref} />
      <button className={`db-backdrop ${sidebarOpen ? "is-visible" : ""}`} type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />
      <div className="db-page">
        <DashHeader onMenuOpen={() => setSidebarOpen(true)} user={user} />
        {children}
      </div>
      {!noGlobalAI && (
        <GlobalAI
          contextLabel={aiContext ?? "Ask about the national portfolio"}
          suggestions={aiSuggestions ?? PORTFOLIO_SUGGESTIONS}
          answer={aiAnswer ?? portfolioAnswer}
          autoOpen={autoOpenAI}
        />
      )}
    </div>
  );
}
