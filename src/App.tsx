import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  ChartNoAxesCombined,
  Gauge,
  LayoutDashboard,
  Menu,
  Radar,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  useCardTilt,
  useInView,
  usePrefersReducedMotion,
  useScrollReveal,
} from "./hooks/usePageMotion";
import { AuthPage } from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AlertsPage from "./pages/AlertsPage";
import MinistriesPage, { MinistryDetailPage } from "./pages/MinistriesPage";
import MinistryDashboardPage from "./pages/MinistryDashboardPage";
import ProjectDirectorDashboard from "./pages/ProjectDirectorDashboard";

export const AUTH_ROUTE = "#/auth";
export const DASHBOARD_ROUTE = "#/dashboard";

const navLinks = [
  { label: "Features", href: "#/features" },
  { label: "How it Works", href: "#/how-it-works" },
  { label: "Dashboard Preview", href: "#/dashboard-preview" },
];

const metrics = [
  { value: 1981, suffix: "", label: "Projects monitored" },
  { value: 17, suffix: "", label: "Ministries connected" },
  { value: 210, suffix: "", label: "High-risk flagged" },
  { value: 24, suffix: "/7", label: "Risk surveillance" },
];

const features = [
  {
    icon: Gauge,
    title: "Predictive Risk Scoring",
    description:
      "A live 0-1 risk score, paired with clear reasons officials can act on.",
  },
  {
    icon: LayoutDashboard,
    title: "Role-Based Dashboards",
    description:
      "Focused views for MoSPI Admins, Ministry Users, and Project Directors.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Real-Time Trend Tracking",
    description:
      "Track cost variance and physical progress over time, not just at review points.",
  },
  {
    icon: Bot,
    title: "AI Assistant, Built In",
    description:
      "Ask plain-language questions and receive concise answers with cited sources.",
  },
];

const processSteps = [
  {
    title: "Data Ingested",
    description:
      "Cost, progress, and milestone data is gathered from project flash reports.",
  },
  {
    title: "AI Scores the Risk",
    description:
      "Models compute a live risk score and surface the factors driving it.",
  },
  {
    title: "Officials Get Early Warnings",
    description:
      "The right alert reaches the right role before delays and overruns escalate.",
  },
];

const projectRows = [
  {
    project: "Western Freight Corridor",
    ministry: "Railways",
    progress: "68%",
    risk: "High",
    badge: "risk-high",
  },
  {
    project: "Kosi River Bridge",
    ministry: "Road Transport",
    progress: "81%",
    risk: "Medium",
    badge: "risk-medium",
  },
  {
    project: "North Grid Substation",
    ministry: "Power",
    progress: "92%",
    risk: "Low",
    badge: "risk-low",
  },
];

const dashboardStats = [
  { label: "Total projects", value: "1,981", tone: "neutral", trend: null },
  {
    label: "High risk",
    value: "210",
    tone: "high",
    trend: { direction: "up", text: "4% this month" },
  },
  {
    label: "Medium risk",
    value: "486",
    tone: "medium",
    trend: { direction: "down", text: "1.8% this month" },
  },
  {
    label: "Low risk",
    value: "1,285",
    tone: "low",
    trend: { direction: "up", text: "2.2% this month" },
  },
];

const chartSeries = [
  { month: "Jan", value: 38 },
  { month: "Feb", value: 47 },
  { month: "Mar", value: 44 },
  { month: "Apr", value: 61 },
  { month: "May", value: 57 },
  { month: "Jun", value: 74 },
  { month: "Jul", value: 88 },
];

const chartPeak = Math.max(...chartSeries.map((point) => point.value));

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#/"
      className={`brand-mark ${light ? "brand-mark-light" : ""}`}
      aria-label="PAIMANA-AI home"
    >
      <Radar size={22} strokeWidth={1.8} aria-hidden="true" />
      <span>PAIMANA-AI</span>
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading" data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

export function Navbar({ variant = "landing" }: { variant?: "landing" | "auth" }) {
  const isAuth = variant === "auth";
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let frame: number | null = null;

    const updateScrollState = () => {
      setHasScrolled(window.scrollY > 50);
      frame = null;
    };

    const onScroll = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`site-header ${hasScrolled ? "site-header-scrolled" : ""} ${menuOpen ? "site-header-menu-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) {
          closeMenu();
          menuButtonRef.current?.focus();
        }
      }}
    >
      <nav className="nav-shell" aria-label="Main navigation">
        <BrandMark />

        <div className="desktop-nav">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        {isAuth ? (
          <a className="back-link nav-login" href="#/">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Home
          </a>
        ) : (
          <a className="button button-primary nav-login" href={AUTH_ROUTE}>
            Login / Register
          </a>
        )}

        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      <div
        id="mobile-navigation"
        className={`mobile-nav ${menuOpen ? "mobile-nav-open" : ""}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
        {isAuth ? (
          <a className="button button-primary" href="#/" onClick={closeMenu}>
            Back to Home
          </a>
        ) : (
          <a className="button button-primary" href={AUTH_ROUTE} onClick={closeMenu}>
            Login / Register
          </a>
        )}
      </div>
    </header>
  );
}

function StatStrip() {
  const [sectionRef, inView] = useInView<HTMLElement>(0.2);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [progress, setProgress] = useState(prefersReducedMotion ? 1 : 0);
  const completed = useRef(false);

  useEffect(() => {
    // Wait for the strip to scroll into view, then run once.
    if (!inView || completed.current) return;

    if (prefersReducedMotion) {
      completed.current = true;
      setProgress(1);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    // One clock drives all four counters at once; cubic ease-out, no bounce.
    const countUp = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = Math.min((timestamp - startTime) / 1500, 1);
      setProgress(1 - Math.pow(1 - elapsed, 3));

      if (elapsed < 1) {
        frame = window.requestAnimationFrame(countUp);
      } else {
        completed.current = true;
      }
    };

    frame = window.requestAnimationFrame(countUp);

    return () => window.cancelAnimationFrame(frame);
  }, [inView, prefersReducedMotion]);

  return (
    <section ref={sectionRef} className="stat-row" aria-label="Platform statistics">
      <div className="page-shell stat-grid">
        {metrics.map((metric) => (
          <div className="stat-item" key={metric.label}>
            <strong>
              <span aria-hidden="true">
                {Math.round(metric.value * progress).toLocaleString("en-US")}
                {metric.suffix}
              </span>
              <span className="sr-only">
                {metric.value.toLocaleString("en-US")}
                {metric.suffix} {metric.label}
              </span>
            </strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Hero() {
  return (
    <>
      <section className="hero" id="top">
        <div className="hero-background" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="page-shell hero-content">
          <p className="hero-eyebrow hero-reveal reveal-one">
            AI-powered early warning system
          </p>
          <h1 className="hero-reveal reveal-two">
            <span className="hero-brand">PAIMANA-AI</span>
            <span>Predict Infrastructure Risk. Act Before It Fails.</span>
          </h1>
          <p className="hero-copy hero-reveal reveal-three">
            AI-driven risk monitoring for MoSPI, ministries, and project
            directors, turning routine reports into timely, explainable early
            warnings.
          </p>
          <div className="hero-actions hero-reveal reveal-four">
            <a className="button button-hero" href={AUTH_ROUTE}>
              Login / Register
            </a>
            <a className="text-link text-link-light" href="#/dashboard-preview">
              See it in action <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <StatStrip />
    </>
  );
}

function Features() {
  return (
    <section className="section section-features" id="features">
      <div className="page-shell">
        <SectionHeading
          eyebrow="What PAIMANA-AI does"
          title="Everything officials need to catch risk early"
          description="A focused monitoring layer that makes project risk visible, explainable, and easier to act on."
        />

        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                className="feature-item"
                key={feature.title}
                data-reveal
                style={{ "--reveal-delay": `${index * 100}ms` } as CSSProperties}
              >
                <Icon size={27} strokeWidth={1.7} aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section process-section" id="how-it-works">
      <div className="page-shell">
        <SectionHeading
          eyebrow="From data to decision"
          title="How PAIMANA-AI works"
          description="A clear three-step path from existing reports to earlier intervention."
        />

        <div className="process-grid">
          {processSteps.map((step, index) => (
            <article
              className="process-step"
              key={step.title}
              data-reveal
              style={{ "--reveal-delay": `${index * 100}ms` } as CSSProperties}
            >
              <div className="step-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const tiltRef = useCardTilt<HTMLDivElement>();
  const [chartRef, chartInView] = useInView<HTMLDivElement>(0.3);

  return (
    <section className="section dashboard-section" id="dashboard-preview">
      <div className="dashboard-texture" aria-hidden="true" />
      <div className="page-shell dashboard-content">
        <SectionHeading
          eyebrow="See it in action"
          title="A dashboard built for fast decisions"
          description="Portfolio-level signals up front, with enough detail to move directly into the projects that need attention."
        />

        <div className="mockup-stage" data-reveal>
          <div className="mockup-glow" aria-hidden="true" />

          <div className="mockup-tilt" ref={tiltRef}>
            <div className="mockup-shell">
              <div className="mockup-window">
                <div className="browser-bar">
                  <span className="browser-dots" aria-hidden="true">
                    <i className="browser-dot browser-dot-ice" />
                    <i className="browser-dot browser-dot-medium" />
                    <i className="browser-dot browser-dot-pain" />
                  </span>
                  <span className="browser-url">app.paimana.ai/dashboard</span>
                  <span className="browser-status">
                    <Activity size={12} aria-hidden="true" /> Synced 4 min ago
                  </span>
                </div>

                <div className="dashboard-body">
                  <div className="dashboard-header">
                    <div>
                      <span className="dashboard-kicker">MoSPI command view</span>
                      <h3>National infrastructure overview</h3>
                    </div>
                    <span className="updated-label">
                      <span className="live-pulse" aria-hidden="true" /> Live data
                    </span>
                  </div>

                  <div className="dashboard-stats">
                    {dashboardStats.map((stat) => {
                      const TrendIcon =
                        stat.trend?.direction === "down" ? TrendingDown : TrendingUp;
                      return (
                        <div className="dashboard-stat" key={stat.label} data-tone={stat.tone}>
                          <span className="stat-accent" aria-hidden="true" />
                          <span className="stat-label">{stat.label}</span>
                          <strong>{stat.value}</strong>
                          {stat.trend && (
                            <span className={`stat-trend trend-${stat.trend.direction}`}>
                              <TrendIcon size={12} strokeWidth={2.2} aria-hidden="true" />
                              {stat.trend.text}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="dashboard-main">
                    <div className="chart-panel">
                      <div className="panel-title-row">
                        <div>
                          <span className="dashboard-kicker">Monthly view</span>
                          <h4>Projects flagged by AI</h4>
                        </div>
                        <span className="chart-legend">
                          <i /> Elevated risk
                        </span>
                      </div>
                      <div
                        className={`chart-area ${chartInView ? "is-live" : ""}`}
                        ref={chartRef}
                      >
                        {chartSeries.map((point, index) => (
                          <div
                            className="bar-column"
                            key={point.month}
                            style={
                              {
                                "--bar-height": `${Math.round((point.value / chartPeak) * 100)}%`,
                                "--bar-delay": `${index * 60}ms`,
                              } as CSSProperties
                            }
                          >
                            <button
                              className="bar-hit"
                              type="button"
                              aria-label={`${point.month}: ${point.value} projects flagged`}
                            >
                              <span className="bar-tip">{point.value} flagged</span>
                              <span className="chart-bar" aria-hidden="true" />
                            </button>
                            <span className="bar-month">{point.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="signal-panel">
                      <span className="dashboard-kicker">Current signal</span>
                      <strong>Cost variance</strong>
                      <div className="signal-figure">
                        <span className="signal-glow" aria-hidden="true" />
                        <span className="signal-value">+8.4%</span>
                        <TrendingUp className="signal-arrow" size={18} strokeWidth={2.2} aria-hidden="true" />
                      </div>
                      <p>Primary risk factor across 16 high-priority projects.</p>
                      <div className="signal-line" aria-hidden="true">
                        <span className={chartInView ? "is-live" : ""} />
                      </div>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <div className="table-heading">
                      <h4>Priority projects</h4>
                      <span>Sorted by risk score</span>
                    </div>
                    <div className="responsive-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Project</th>
                            <th>Ministry</th>
                            <th>Progress</th>
                            <th>Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectRows.map((row) => (
                            <tr key={row.project}>
                              <td>{row.project}</td>
                              <td>{row.ministry}</td>
                              <td>{row.progress}</td>
                              <td>
                                <span className={`risk-badge ${row.badge}`}>{row.risk}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta" id="get-started">
      <div className="page-shell cta-content" data-reveal>
        <p className="cta-eyebrow">Earlier signals. Better decisions.</p>
        <h2>Ready to see the risk before it happens?</h2>
        <a className="button button-hero" href={AUTH_ROUTE}>
          Login / Register
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-shell footer-main">
        <div>
          <BrandMark light />
          <p>Explainable early warning for public infrastructure.</p>
        </div>
        <div className="footer-links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="page-shell footer-bottom">
        Built for MoSPI Infrastructure Monitoring &middot; Smart India Hackathon
      </div>
    </footer>
  );
}

function LandingPage({ section }: { section: string | null }) {
  const motionRootRef = useScrollReveal();

  // "#/features" style links scroll to the matching section on the home route.
  useEffect(() => {
    if (!section) {
      window.scrollTo({ top: 0 });
      return;
    }
    const target = document.getElementById(section);
    if (!target) return;
    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [section]);

  return (
    <div ref={motionRootRef} className="app-shell">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const path = hash.replace(/^#\/?/, "");

  if (path === "auth")       return <AuthPage />;

  // Ministry-scoped dashboards: /dashboard/:slug optionally followed by a section.
  if (path.startsWith("dashboard/")) {
    const [slug, section = "overview"] = path.slice("dashboard/".length).split("/");
    return <MinistryDashboardPage slug={decodeURIComponent(slug)} section={section} />;
  }

  if (path.startsWith("project-director/dashboard")) {
    let rest = path.slice("project-director/dashboard".length);
    if (rest.startsWith("/")) rest = rest.slice(1);
    // Support ?project=P-12345 query-style links as well as /:projectId/:section
    const queryMatch = rest.match(/[?&]project=([^&/]+)/);
    if (queryMatch) {
      return <ProjectDirectorDashboard projectId={decodeURIComponent(queryMatch[1])} section="overview" />;
    }
    const [rawId = "", rawSection = "overview"] = rest.split("/");
    const projectId = decodeURIComponent(rawId);
    const section = ["overview", "progress", "alerts", "tasks", "messages", "reports", "settings"].includes(rawSection)
      ? rawSection
      : "overview";
    return <ProjectDirectorDashboard projectId={projectId} section={section} />;
  }
  if (path === "dashboard")  return <DashboardPage />;
  if (path === "projects")   return <ProjectsPage />;
  if (path === "analytics")  return <AnalyticsPage />;
  if (path === "alerts")     return <AlertsPage />;
  if (path === "ministries") return <MinistriesPage />;
  if (path.startsWith("project/"))  return <ProjectDetailPage projectId={decodeURIComponent(path.slice("project/".length))} />;
  if (path.startsWith("ministry/")) return <MinistryDetailPage ministryName={decodeURIComponent(path.slice("ministry/".length))} />;

  return <LandingPage section={path || null} />;
}
