import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Eye, EyeOff, Radar, Search } from "lucide-react";
import { Navbar } from "../App";
import {
  AUTH_MINISTRIES,
  DEMO_ACCOUNTS,
  dashboardRouteFor,
  ministryLabelFor,
  writeSession,
  type UserRole,
} from "../data/ministryUser";
import { ALL_PROJECT_OPTIONS, projectOptionFor } from "../data/projectDirector";

type Tab = "login" | "register";

const ROLES: UserRole[] = ["MoSPI Admin", "Ministry User", "Project Director"];

type Errors = Record<string, string | undefined>;

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`field ${error ? "field-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, invalid }: {
  id: string; value: string; onChange: (value: string) => void; autoComplete: string; invalid: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      />
      <button type="button" className="eye-button" onClick={() => setVisible((state) => !state)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible}>
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

function MinistrySelect({ id, value, onChange, invalid, disabled = false }: {
  id: string; value: string; onChange: (value: string) => void; invalid?: boolean; disabled?: boolean;
}) {
  return (
    <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}>
      <option value="">Select ministry…</option>
      {AUTH_MINISTRIES.map((ministry) => <option key={ministry.slug} value={ministry.slug}>{ministry.label}</option>)}
    </select>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button type="submit" className="button button-primary button-block" disabled={loading} aria-busy={loading}>
      {loading ? <><span className="spinner" aria-hidden="true" /><span className="sr-only">Please wait</span></> : children}
    </button>
  );
}

function useSubmit() {
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const run = (redirect: string) => {
    setLoading(true);
    timer.current = window.setTimeout(() => { window.location.hash = redirect; }, 800);
  };

  return { loading, run };
}

/** Type-to-filter project combobox used by the Project Director role. */
function ProjectCombobox({ id, value, onChange, invalid }: {
  id: string; value: string; onChange: (id: string) => void; invalid?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = ALL_PROJECT_OPTIONS.find((option) => option.id === value) ?? null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALL_PROJECT_OPTIONS;
    return ALL_PROJECT_OPTIONS.filter((option) => option.label.toLowerCase().includes(needle));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className={`pd-combo ${invalid ? "is-invalid" : ""}`} ref={wrapRef}>
      <div className="pd-combo-control">
        <Search size={15} className="pd-combo-icon" aria-hidden="true" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search by project ID or name…"
          value={open ? query : selected ? selected.label : query}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && filtered.length > 0) {
              event.preventDefault();
              onChange(filtered[0].id);
              setOpen(false);
            }
          }}
        />
        <button type="button" className="pd-combo-toggle" aria-label="Toggle project list" onClick={() => setOpen((state) => !state)}>
          <ChevronDown size={15} />
        </button>
      </div>
      {open && (
        <ul className="pd-combo-list" id={`${id}-list`} role="listbox">
          {filtered.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                role="option"
                aria-selected={option.id === value}
                className={option.id === value ? "is-selected" : ""}
                onClick={() => { onChange(option.id); setOpen(false); }}
              >
                <strong>{option.id}</strong>
                <span>{option.name}</span>
                <small>{option.ministry}</small>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="pd-combo-empty">No projects match that search.</li>}
        </ul>
      )}
    </div>
  );
}

function PdMinistryField({ id, projectId }: { id: string; projectId: string }) {
  const option = projectOptionFor(projectId);
  return (
    <div className="field">
      <label htmlFor={id}>Ministry (auto-filled)</label>
      <input id={id} type="text" value={option ? option.ministry : ""} readOnly disabled placeholder="Select a project first" className="pd-readonly" />
    </div>
  );
}

function LoginForm() {
  const uid = useId();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("MoSPI Admin");
  const [ministrySlug, setMinistrySlug] = useState("");
  const [projectId, setProjectId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const { loading, run } = useSubmit();

  const needsMinistry = role === "Ministry User";
  const needsProject = role === "Project Director";

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!identifier.trim()) next.identifier = "Enter your username or email.";
    if (!password) next.password = "Enter your password.";
    if (needsMinistry && !ministrySlug) next.ministry = "Select your ministry.";
    if (needsProject && !projectId) next.project = "Select your assigned project.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    writeSession({
      role,
      ministrySlug: needsMinistry ? ministrySlug : null,
      ministryLabel: needsMinistry ? ministryLabelFor(ministrySlug) : null,
      projectId: needsProject ? projectId : null,
      name: identifier.split("@")[0] || identifier,
    });
    run(dashboardRouteFor({
      role,
      ministrySlug: needsMinistry ? ministrySlug : null,
      ministryLabel: needsMinistry ? ministryLabelFor(ministrySlug) : null,
      projectId: needsProject ? projectId : null,
      name: identifier,
    }));
  };

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <Field id={`${uid}-id`} label="Username or email" error={errors.identifier}>
        <input id={`${uid}-id`} type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? `${uid}-id-error` : undefined} />
      </Field>

      <Field id={`${uid}-pw`} label="Password" error={errors.password}>
        <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="current-password" invalid={Boolean(errors.password)} />
      </Field>

      <Field id={`${uid}-role`} label="Role (demo)">
        <select id={`${uid}-role`} value={role} onChange={(event) => {
          const nextRole = event.target.value as UserRole;
          setRole(nextRole);
          if (nextRole !== "Ministry User") setMinistrySlug("");
          if (nextRole !== "Project Director") setProjectId("");
          setErrors({});
        }}>
          {ROLES.map((option) => <option key={option}>{option}</option>)}
        </select>
      </Field>

      <div className={`field-expand ${needsMinistry ? "is-open" : ""}`}>
        <div className="field-expand-content">
          <Field id={`${uid}-ministry`} label="Ministry / department" error={errors.ministry}>
            <MinistrySelect id={`${uid}-ministry`} value={ministrySlug} onChange={setMinistrySlug} invalid={Boolean(errors.ministry)} />
          </Field>
        </div>
      </div>

      <div className={`field-expand ${needsProject ? "is-open" : ""}`}>
        <div className="field-expand-content">
          <div className={`field ${errors.project ? "field-invalid" : ""}`}>
            <label htmlFor={`${uid}-project`}>Assigned project</label>
            <ProjectCombobox id={`${uid}-project`} value={projectId} onChange={setProjectId} invalid={Boolean(errors.project)} />
            {errors.project && <p className="field-error" id={`${uid}-project-error`} role="alert">{errors.project}</p>}
          </div>
          <div className="field-expand-inner">
            <PdMinistryField id={`${uid}-pd-ministry`} projectId={projectId} />
          </div>
        </div>
      </div>

      <div className="form-aside">
        <a href="#/auth" className="muted-link" onClick={(event) => event.preventDefault()}>Forgot password?</a>
      </div>

      <SubmitButton loading={loading}>Log In</SubmitButton>

      <div className="demo-box" aria-label="Demo credentials">
        <span className="demo-title">Demo credentials</span>
        {DEMO_ACCOUNTS.map((account) => (
          <code key={account.user}>
            {account.role === "Project Director" ? `Project Director: ${account.user} / ${account.pass} (${account.scope})` : `${account.user} / ${account.pass}`}
            {account.role !== "Project Director" && <span>{account.role === "MoSPI Admin" ? `${account.role} · ${account.scope}` : `${account.role} · ${account.scope}`}</span>}
          </code>
        ))}
      </div>
    </form>
  );
}

function RegisterForm() {
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Ministry User");
  const [ministrySlug, setMinistrySlug] = useState("");
  const [projectId, setProjectId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const { loading, run } = useSubmit();

  const needsMinistry = role === "Ministry User";
  const needsProject = role === "Project Director";

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your official email.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (needsMinistry && !ministrySlug) next.ministry = "Select your ministry.";
    if (needsProject && !projectId) next.project = "Select your assigned project.";
    if (!password) next.password = "Create a password.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    if (!confirm) next.confirm = "Confirm your password.";
    else if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    writeSession({
      role,
      ministrySlug: needsMinistry ? ministrySlug : null,
      ministryLabel: needsMinistry ? ministryLabelFor(ministrySlug) : null,
      projectId: needsProject ? projectId : null,
      name,
    });
    run(dashboardRouteFor({
      role,
      ministrySlug: needsMinistry ? ministrySlug : null,
      ministryLabel: needsMinistry ? ministryLabelFor(ministrySlug) : null,
      projectId: needsProject ? projectId : null,
      name,
    }));
  };

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <Field id={`${uid}-name`} label="Full name" error={errors.name}>
        <input id={`${uid}-name`} type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${uid}-name-error` : undefined} />
      </Field>

      <Field id={`${uid}-role`} label="Role">
        <select id={`${uid}-role`} value={role} onChange={(event) => {
          const nextRole = event.target.value as UserRole;
          setRole(nextRole);
          if (nextRole !== "Ministry User") setMinistrySlug("");
          if (nextRole !== "Project Director") setProjectId("");
        }}>
          {ROLES.map((option) => <option key={option}>{option}</option>)}
        </select>
      </Field>

      {needsMinistry && (
        <Field id={`${uid}-ministry`} label="Ministry / department" error={errors.ministry}>
          <MinistrySelect id={`${uid}-ministry`} value={ministrySlug} onChange={setMinistrySlug} invalid={Boolean(errors.ministry)} />
        </Field>
      )}

      {needsProject && (
        <>
          <div className={`field ${errors.project ? "field-invalid" : ""}`}>
            <label htmlFor={`${uid}-project`}>Assigned project</label>
            <ProjectCombobox id={`${uid}-project`} value={projectId} onChange={setProjectId} invalid={Boolean(errors.project)} />
            {errors.project && <p className="field-error" id={`${uid}-project-error`} role="alert">{errors.project}</p>}
          </div>
          <PdMinistryField id={`${uid}-pd-ministry`} projectId={projectId} />
        </>
      )}

      {!needsMinistry && !needsProject && (
        <p className="field-hint">MoSPI Admin accounts can view every ministry — no scoping selection needed.</p>
      )}

      <Field id={`${uid}-email`} label="Official email" error={errors.email}>
        <input id={`${uid}-email`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@gov.in" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${uid}-email-error` : undefined} />
      </Field>

      <div className="field-row">
        <Field id={`${uid}-pw`} label="Password" error={errors.password}>
          <PasswordInput id={`${uid}-pw`} value={password} onChange={setPassword} autoComplete="new-password" invalid={Boolean(errors.password)} />
        </Field>
        <Field id={`${uid}-confirm`} label="Confirm password" error={errors.confirm}>
          <PasswordInput id={`${uid}-confirm`} value={confirm} onChange={setConfirm} autoComplete="new-password" invalid={Boolean(errors.confirm)} />
        </Field>
      </div>

      <SubmitButton loading={loading}>Create Account</SubmitButton>

      <p className="terms-note">By registering you agree to PAIMANA-AI's usage terms.</p>
    </form>
  );
}

export function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [shown, setShown] = useState<Tab>("login");
  const [fading, setFading] = useState(false);
  const switchTimer = useRef<number | null>(null);

  useEffect(() => {
    document.title = "Sign in | PAIMANA-AI";
    window.scrollTo({ top: 0 });
    return () => { document.title = "PAIMANA-AI | Infrastructure Risk Monitoring"; };
  }, []);

  useEffect(() => () => { if (switchTimer.current !== null) window.clearTimeout(switchTimer.current); }, []);

  const switchTab = (next: Tab) => {
    if (next === tab || fading) return;
    setTab(next);
    setFading(true);
    switchTimer.current = window.setTimeout(() => { setShown(next); setFading(false); }, 200);
  };

  return (
    <div className="app-shell auth-page">
      <Navbar variant="auth" />
      <main className="auth-main">
        <div className="auth-stage">
          <div className="auth-glow" aria-hidden="true" />
          <div className="auth-brand">
            <span className="brand-mark" aria-hidden="true"><Radar size={22} strokeWidth={1.8} /><span>PAIMANA-AI</span></span>
            <h1 className="sr-only">Sign in to PAIMANA-AI</h1>
            <p>Predictive Infrastructure Risk Intelligence.</p>
          </div>

          <section className="auth-card" aria-label="Account access">
            <div className="auth-tabs" role="tablist" aria-label="Login or register">
              {(["login", "register"] as Tab[]).map((option) => (
                <button key={option} type="button" role="tab" id={`tab-${option}`} aria-selected={tab === option} aria-controls="auth-panel" className={`auth-tab ${tab === option ? "is-active" : ""}`} onClick={() => switchTab(option)}>
                  {option === "login" ? "Login" : "Register"}
                </button>
              ))}
              <span className="auth-tab-indicator" aria-hidden="true" style={{ transform: `translateX(${tab === "login" ? "0%" : "100%"})` }} />
            </div>

            <div id="auth-panel" role="tabpanel" aria-labelledby={`tab-${shown}`} className={`auth-panel ${fading ? "is-fading" : ""}`}>
              {shown === "login" ? <LoginForm /> : <RegisterForm />}
            </div>

            <div className="auth-footer">
              {shown === "login" ? (
                <>New to PAIMANA-AI? <button type="button" className="inline-link" onClick={() => switchTab("register")}>Register</button></>
              ) : (
                <>Already have an account? <button type="button" className="inline-link" onClick={() => switchTab("login")}>Log in</button></>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
