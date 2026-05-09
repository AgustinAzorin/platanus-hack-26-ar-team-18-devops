// Shell: sidebar, top bar, common primitives. Plus app-level state container.

// ============ STATE STORE (simple ctx) ============
const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);

function StoreProvider({ children }) {
  // Initialize from SEED — but allow mutations (claims status changes, evidence uploads).
  const [claims, setClaims]       = useState(window.SEED.claims);
  const [evidence, setEvidence]   = useState(window.SEED.evidence);
  const [works, setWorks]         = useState(window.SEED.works);
  const [contracts, setContracts] = useState(window.SEED.contracts);
  const [threads, setThreads]     = useState(window.SEED.threads);
  const [recordings, setRecordings] = useState(window.SEED.recordings);
  const [artists, setArtists]     = useState(window.SEED.artists);
  const [botLog, setBotLog]       = useState(window.SEED.botLog);

  // Routing — page + selected id
  const [route, setRoute] = useState({ page: 'dashboard', id: null });

  // Notifications (toasts)
  const [toasts, setToasts] = useState([]);
  const pushToast = (text, kind = 'info') => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts(t => [...t, { id, text, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  };

  const go = (page, id = null) => setRoute({ page, id });

  // Lookups
  const lookups = useMemo(() => ({
    artistById:    Object.fromEntries(artists.map(a => [a.id, a])),
    workById:      Object.fromEntries(works.map(w => [w.id, w])),
    recById:       Object.fromEntries(recordings.map(r => [r.id, r])),
    evidenceByWork: works.reduce((acc, w) => (acc[w.id] = evidence.filter(e => e.workId === w.id), acc), {}),
    contractsByWork: works.reduce((acc, w) => (acc[w.id] = contracts.filter(c => c.workId === w.id), acc), {}),
    recordingsByWork: works.reduce((acc, w) => (acc[w.id] = recordings.filter(r => r.workId === w.id), acc), {}),
  }), [artists, works, recordings, evidence, contracts]);

  // Mutators
  const updateClaim = (id, patch) => setClaims(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
  const appendThread = (claimId, msg) => setThreads(t => ({ ...t, [claimId]: [...(t[claimId] || []), msg] }));
  const addEvidence = (ev) => setEvidence(es => [{ ...ev, id: 'e-' + Date.now() }, ...es]);
  const addWork = (w) => setWorks(ws => [{ ...w, id: 'w-' + Date.now() }, ...ws]);
  const addArtist = (a) => setArtists(as => [{ ...a, id: 'a-' + Date.now() }, ...as]);
  const logBot = (entry) => setBotLog(l => [{ ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), ...entry }, ...l]);

  const value = {
    claims, evidence, works, contracts, threads, recordings, artists, botLog,
    lookups,
    route, go,
    toasts, pushToast,
    updateClaim, appendThread, addEvidence, addWork, addArtist, logBot,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

// ============ FORMATTERS ============
const fmt = {
  money: (n) => 'AR$ ' + n.toLocaleString('en-US'),
  pct:   (n) => Math.round(n * 100) + '%',
  date:  (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },
  time:  (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },
  duration: (s) => {
    if (!s) return '—';
    const m = Math.floor(s / 60); const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  }
};
window.fmt = fmt;

// ============ STATUS META ============
const STATUS_META = {
  detected:           { label: 'Detected',          dot: 'var(--accent)',  bg: 'oklch(96% 0.02 250)', fg: 'oklch(35% 0.13 250)' },
  submitted:          { label: 'Sent to SADAIC',    dot: 'oklch(60% 0.13 200)', bg: 'oklch(96% 0.02 200)', fg: 'oklch(35% 0.13 200)' },
  awaiting_evidence:  { label: 'Action required',   dot: 'oklch(70% 0.16 65)',  bg: 'oklch(96% 0.04 75)',  fg: 'oklch(40% 0.13 55)'  },
  resolved:           { label: 'Resolved',          dot: 'oklch(58% 0.13 150)', bg: 'oklch(96% 0.04 150)', fg: 'oklch(36% 0.12 150)' },
  rejected:           { label: 'Rejected',          dot: 'oklch(58% 0.18 25)',  bg: 'oklch(96% 0.03 25)',  fg: 'oklch(40% 0.16 25)'  },
};
window.STATUS_META = STATUS_META;

// ============ COMMON UI ============
function Badge({ children, kind = 'neutral', dot, style }) {
  const palettes = {
    neutral: { bg: 'var(--bg-mute)',  fg: 'var(--fg-mute)' },
    accent:  { bg: 'oklch(96% 0.02 250)', fg: 'oklch(35% 0.13 250)' },
    success: { bg: 'oklch(96% 0.04 150)', fg: 'oklch(36% 0.12 150)' },
    warn:    { bg: 'oklch(96% 0.04 75)',  fg: 'oklch(40% 0.13 55)' },
    danger:  { bg: 'oklch(96% 0.03 25)',  fg: 'oklch(40% 0.16 25)' },
  };
  const p = palettes[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 500, lineHeight: '18px',
      background: p.bg, color: p.fg, whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: dot }} />}
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, dot: 'gray', bg: 'var(--bg-mute)', fg: 'var(--fg-mute)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 500, lineHeight: '18px',
      background: m.bg, color: m.fg, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: m.dot }} />
      {m.label}
    </span>
  );
}

function ConfidenceBar({ value, w = 60 }) {
  const pct = Math.round(value * 100);
  let color = 'oklch(58% 0.13 150)';
  if (pct < 70) color = 'oklch(70% 0.16 65)';
  if (pct < 40) color = 'oklch(58% 0.18 25)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: w, height: 4, borderRadius: 2, background: 'var(--bg-mute)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, transition: 'width .25s' }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg)', minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

function Btn({ children, variant = 'secondary', size = 'md', icon, onClick, disabled, style, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent', borderRadius: 6,
    padding: size === 'sm' ? '4px 10px' : '6px 12px',
    fontSize: size === 'sm' ? 12 : 13,
    transition: 'all .12s',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };
  const variants = {
    primary:   { background: 'var(--fg)', color: 'var(--bg)', borderColor: 'var(--fg)' },
    secondary: { background: 'var(--bg)', color: 'var(--fg)', borderColor: 'var(--border)' },
    ghost:     { background: 'transparent', color: 'var(--fg-mute)', borderColor: 'transparent' },
    danger:    { background: 'var(--bg)', color: 'oklch(50% 0.18 25)', borderColor: 'var(--border)' },
    accent:    { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => { if (!disabled && variant === 'secondary') e.currentTarget.style.background = 'var(--bg-mute)'; if (!disabled && variant === 'ghost') e.currentTarget.style.background = 'var(--bg-mute)'; }}
      onMouseLeave={e => { if (!disabled && variant === 'secondary') e.currentTarget.style.background = 'var(--bg)'; if (!disabled && variant === 'ghost') e.currentTarget.style.background = 'transparent'; }}>
      {icon}{children}
    </button>
  );
}

function Kbd({ children }) {
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '1px 5px', borderRadius: 3, background: 'var(--bg-mute)', color: 'var(--fg-mute)', border: '1px solid var(--border)' }}>{children}</span>;
}

function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div style={{
      padding: '20px 28px 16px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--fg-mute)', marginBottom: 6 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3, color: 'var(--fg)' }}>{title}</h1>
        {subtitle && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--fg-mute)' }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// ============ ICONS (inline SVG, 16px) ============
const Icon = ({ name, size = 16, style }) => {
  const sw = 1.5;
  const c = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    home:    <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    inbox:   <><path d="M3 13l3-9h12l3 9" /><path d="M3 13v6h18v-6" /><path d="M3 13h5l1 3h6l1-3h5" /></>,
    upload:  <><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></>,
    book:    <><path d="M4 4h13a3 3 0 013 3v13a3 3 0 01-3-3H4z" /><path d="M4 4v15" /></>,
    plus:    <><path d="M12 5v14M5 12h14" /></>,
    bell:    <><path d="M6 9a6 6 0 0112 0v5l1.5 3h-15L6 14V9z" /><path d="M9 19a3 3 0 006 0" /></>,
    settings:<><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4.8a7 7 0 00-2.1-1.2L14 3h-4l-.4 2.5a7 7 0 00-2 1.2L5 5.9 3 9.3l2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.8a7 7 0 002.1 1.2L10 21h4l.4-2.5a7 7 0 002-1.2L19 18l2-3.4-2-1.5z" /></>,
    search:  <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></>,
    chevron: <path d="M9 6l6 6-6 6" />,
    chevronD:<path d="M6 9l6 6 6-6" />,
    file:    <><path d="M14 3H6v18h12V8z" /><path d="M14 3v5h5" /></>,
    music:   <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
    user:    <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></>,
    mail:    <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" /></>,
    paperclip:<path d="M21 11l-9 9a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8" />,
    check:   <path d="M5 12l5 5L20 6" />,
    x:       <path d="M6 6l12 12M18 6l-12 12" />,
    sparkle: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" /></>,
    arrowRight: <path d="M5 12h14M13 5l7 7-7 7" />,
    download:<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
    eye:     <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    flag:    <><path d="M5 21V4M5 4h12l-3 4 3 4H5" /></>,
    play:    <path d="M6 4l14 8-14 8z" />,
    filter:  <path d="M4 5h16l-6 8v6l-4-2v-4z" />,
    folder:  <path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    bot:     <><rect x="4" y="8" width="16" height="11" rx="2" /><circle cx="9" cy="13" r="1" fill="currentColor" /><circle cx="15" cy="13" r="1" fill="currentColor" /><path d="M12 4v4M9 4h6" /></>,
    excel:   <><path d="M14 3H6v18h12V8z" /><path d="M14 3v5h5" /><path d="M9 13l4 5M13 13l-4 5" /></>,
    arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
    arrowDown: <path d="M12 5v14M5 12l7 7 7-7" />,
    refresh: <><path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 4v5h-5" /></>,
    clock:   <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    db:      <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  };
  return <svg {...c}>{paths[name] || null}</svg>;
};
window.Icon = Icon;

// ============ SIDEBAR ============
function Sidebar({ tweaks }) {
  const { route, go, claims } = useStore();
  const counts = useMemo(() => ({
    inbox:    claims.length,
    action:   claims.filter(c => c.status === 'awaiting_evidence').length,
    detected: claims.filter(c => c.status === 'detected').length,
  }), [claims]);

  const NAV = [
    { kind: 'item', page: 'dashboard', icon: 'home',   label: 'Overview' },
    { kind: 'item', page: 'inbox',     icon: 'inbox',  label: 'Claims',          right: counts.inbox },
    { kind: 'item', page: 'actions',   icon: 'flag',   label: 'Action required', right: counts.action, alert: counts.action > 0 },
    { kind: 'item', page: 'upload',    icon: 'upload', label: 'Ingest report' },
    { kind: 'header', label: 'Catalog' },
    { kind: 'item', page: 'works',     icon: 'music', label: 'Works' },
    { kind: 'item', page: 'artists',   icon: 'user',  label: 'Artists' },
    { kind: 'item', page: 'evidence',  icon: 'folder',label: 'Evidence' },
    { kind: 'item', page: 'contracts', icon: 'file',  label: 'Contracts' },
    { kind: 'item', page: 'newwork',   icon: 'plus',  label: 'New work' },
  ];

  return (
    <aside style={{
      width: 244, background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--fg), oklch(35% 0.13 250))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--bg)', fontSize: 13, fontWeight: 700, letterSpacing: -0.5,
        }}>◐</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: -0.2 }}>Copyregister</div>
          <div style={{ fontSize: 10.5, color: 'var(--fg-mute)', fontFamily: 'var(--mono)' }}>Calma Ediciones · Operator</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 6,
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <Icon name="search" size={13} style={{ color: 'var(--fg-mute)' }} />
          <span style={{ fontSize: 12, color: 'var(--fg-mute)', flex: 1 }}>Search</span>
          <Kbd>⌘K</Kbd>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '4px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV.map((it, i) => {
          if (it.kind === 'header') {
            return <div key={i} style={{
              fontSize: 10.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: 0.6,
              color: 'var(--fg-mute)', padding: '12px 10px 6px',
            }}>{it.label}</div>;
          }
          const active = route.page === it.page;
          return (
            <button key={i} onClick={() => go(it.page)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', borderRadius: 5, border: 'none',
                background: active ? 'var(--bg)' : 'transparent',
                color: active ? 'var(--fg)' : 'var(--fg-mute)',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 500 : 400,
                textAlign: 'left',
                boxShadow: active ? 'inset 0 0 0 1px var(--border)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,.03)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={it.icon} size={15} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.right != null && (
                <span style={{
                  fontSize: 11, fontFamily: 'var(--mono)',
                  padding: '0 6px', minWidth: 18, height: 17, borderRadius: 3,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: it.alert ? 'oklch(96% 0.04 75)' : 'var(--bg-mute)',
                  color: it.alert ? 'oklch(40% 0.13 55)' : 'var(--fg-mute)',
                }}>{it.right}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bot status pill */}
      <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: 10, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ position: 'relative', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'oklch(58% 0.13 150)' }} />
              <span style={{ position: 'absolute', inset: -3, borderRadius: 7, background: 'oklch(58% 0.13 150)', opacity: 0.3, animation: 'pulse 1.6s ease-out infinite' }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)' }}>Agent online</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--fg-mute)', lineHeight: 1.4 }}>
            Reclaiming on behalf of <span style={{ color: 'var(--fg)' }}>Calma Ediciones</span>. Last sync 2m ago.
          </div>
        </div>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;

// ============ TOPBAR ============
function TopBar() {
  const { route, claims } = useStore();
  const TITLES = {
    dashboard: 'Overview',
    inbox: 'Claims',
    actions: 'Action required',
    upload: 'Ingest report',
    works: 'Works',
    artists: 'Artists',
    evidence: 'Evidence',
    contracts: 'Contracts',
    newwork: 'New work',
    claim: claims.find(c => c.id === route.id)?.id || 'Claim',
    work: 'Work',
  };
  return (
    <div style={{
      height: 44, borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14,
      background: 'var(--bg)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-mute)' }}>
        <span>Calma Ediciones</span>
        <Icon name="chevron" size={12} />
        <span style={{ color: 'var(--fg)' }}>{TITLES[route.page] || route.page}</span>
        {route.id && <><Icon name="chevron" size={12} /><span style={{ fontFamily: 'var(--mono)', color: 'var(--fg)' }}>{route.id}</span></>}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--fg-mute)' }}>SADAIC sync · 09:14:08 today</div>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-mute)', padding: 4 }}>
        <Icon name="bell" size={16} />
      </button>
      <div style={{
        width: 26, height: 26, borderRadius: 13, background: 'oklch(85% 0.05 250)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, color: 'oklch(35% 0.13 250)',
      }}>NS</div>
    </div>
  );
}
window.TopBar = TopBar;

// ============ TOASTS ============
function Toasts() {
  const { toasts } = useStore();
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 14px', borderRadius: 6,
          background: 'var(--fg)', color: 'var(--bg)',
          fontSize: 13, boxShadow: '0 8px 30px rgba(0,0,0,.15)',
          maxWidth: 360, lineHeight: 1.4,
          animation: 'slideUp .25s ease-out',
        }}>{t.text}</div>
      ))}
    </div>
  );
}
window.Toasts = Toasts;

// Expose primitives globally
Object.assign(window, { Badge, StatusBadge, ConfidenceBar, Btn, Kbd, PageHeader, StoreProvider, useStore, fmt });
