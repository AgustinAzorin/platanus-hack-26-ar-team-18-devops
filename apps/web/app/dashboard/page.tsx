'use client';

import { useEffect } from 'react';
import { Search, Layers, MessageSquare, Bell, BarChart2, Wand2 } from 'lucide-react';

const SW = 1.6;

const navItems = [
  { id: 'home',       href: '/home',       label: 'Buscar',         ico: 'search', group: 'principal' },
  { id: 'feed',       href: '/feed',       label: 'Encontrados',    ico: 'stack',  badge: '24', group: 'principal' },
  { id: 'chats',      href: '/chats',      label: 'Conversaciones', ico: 'chat',   badge: '8',  group: 'principal' },
  { id: 'pending',    href: '/pending',    label: 'Pendientes',     ico: 'bell',   badge: '3',  urgent: true, group: 'principal' },
  { id: 'dashboard',  href: '/dashboard',  label: 'Métricas',       ico: 'spark',  group: 'operación' },
  { id: 'onboarding', href: '/onboarding', label: 'Setup inicial',  ico: 'wand',   group: 'operación' },
] as const;

const navIcons: Record<string, React.ReactNode> = {
  search: <Search       size={16} strokeWidth={SW} />,
  stack:  <Layers       size={16} strokeWidth={SW} />,
  chat:   <MessageSquare size={16} strokeWidth={SW} />,
  bell:   <Bell         size={16} strokeWidth={SW} />,
  spark:  <BarChart2    size={16} strokeWidth={SW} />,
  wand:   <Wand2        size={16} strokeWidth={SW} />,
};

function Sidebar() {
  const groups = navItems.reduce<Record<string, typeof navItems[number][]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="side">
      <div className="brand">
        <div className="mark">c.</div>
        <div className="name">casita<span style={{ color: 'var(--fg-3)' }}>·</span>fast</div>
        <div className="meta">v0.4</div>
      </div>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="nav">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className={`${item.id === 'dashboard' ? 'active' : ''} ${'urgent' in item && item.urgent ? 'urgent' : ''}`}
              >
                <span className="ico">{navIcons[item.ico]}</span>
                <span>{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className="badge">{item.badge}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}
      <div className="side-foot">
        <div className="user">
          <div className="avatar">M</div>
          <div className="who">
            Martina Ríos
            <small>Plan agente · BA</small>
          </div>
          <div className="status" title="Bot activo" />
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Métricas</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        últimos 7 días
      </div>
      <div className="right">
        <button className="btn btn-ghost">Exportar CSV</button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = window as any;
    if (g.gsap) { initAnimations(g.gsap); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    script.onload = () => initAnimations(g.gsap);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function initAnimations(gsap: any) {
    gsap.defaults({ ease: 'power3.out' });

    gsap.from('.side',   { x: -24, autoAlpha: 0, duration: 0.7 });
    gsap.from('.topbar', { y: -12, autoAlpha: 0, duration: 0.6, delay: 0.1 });
    gsap.from('.js-fade', { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.08, delay: 0.2 });

    gsap.from('.hist .bar',          { scaleY: 0, transformOrigin: 'bottom', duration: 0.7, stagger: 0.04, ease: 'power2.out', delay: 0.3 });
    gsap.from('.barlist .bar i',     { width: 0, duration: 0.9, stagger: 0.05, ease: 'power2.out', delay: 0.3 });
    gsap.from('.funnel .fill',       { width: 0, duration: 0.9, stagger: 0.06, ease: 'power2.out', delay: 0.2 });
    gsap.from('.response-row .seg-bar i', { width: 0, duration: 0.9, stagger: 0.05, ease: 'power2.out', delay: 0.3 });

    document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
      const target   = parseFloat(el.dataset.count ?? '0');
      const decimals = parseInt(el.dataset.decimals ?? '0', 10);
      const suffix   = el.dataset.suffix ?? '';
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.5, ease: 'power2.out', delay: 0.2,
        onUpdate: () => {
          const val = decimals > 0
            ? obj.v.toFixed(decimals)
            : Math.round(obj.v).toLocaleString('es-AR');
          el.textContent = val + suffix;
        },
      });
    });
  }

  return (
    <div className="app">
      <Sidebar />
      <div>
        <Topbar />
        <main className="dash" style={{ padding: '40px 56px 80px' }}>

          {/* Header */}
          <header className="js-fade" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 32 }}>
            <div>
              <div className="eyebrow"><span className="dot" />OPERACIÓN · 1 — 9 MAY · BUENOS AIRES</div>
              <h1 style={{ margin: '14px 0 0', fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
                Cómo le va a <span style={{ color: 'var(--acc)' }}>Casita</span><br />
                <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--fg-2)' }}>esta semana.</span>
              </h1>
            </div>
            <div style={{ display: 'inline-flex', padding: 3, border: '1px solid var(--line)', borderRadius: 999, background: 'var(--bg-1)' }}>
              {['HOY', '7 DÍAS', '30 DÍAS', 'TODO'].map((label) => (
                <button key={label} style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 12,
                  color: label === '7 DÍAS' ? 'var(--fg)' : 'var(--fg-2)',
                  background: label === '7 DÍAS' ? 'var(--bg-3)' : 'transparent',
                  fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em',
                }}>{label}</button>
              ))}
            </div>
          </header>

          {/* KPI strip */}
          <section className="js-fade" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            border: '1px solid var(--line)', borderRadius: 'var(--r-3)',
            marginBottom: 24, overflow: 'hidden',
          }}>
            {[
              { label: 'contactados', count: 412, color: 'var(--fg)', suffix: '', delta: '↑ 28% vs sem. ant.', deltaDir: 'up',
                spark: 'M0 24 L10 22 L20 18 L30 20 L40 14 L50 16 L60 8 L70 10 L80 4', sparkColor: 'oklch(0.92 0.205 116)' },
              { label: 'tasa de respuesta', count: 38, color: 'var(--acc)', suffix: '%', delta: '↑ 4 pts', deltaDir: 'up',
                spark: 'M0 18 L10 16 L20 22 L30 14 L40 18 L50 12 L60 16 L70 10 L80 8', sparkColor: 'oklch(0.92 0.205 116)' },
              { label: 'visitas agendadas', count: 21, color: 'var(--fg)', suffix: '', delta: '↑ 5 vs sem. ant.', deltaDir: 'up',
                spark: 'M0 26 L10 24 L20 24 L30 16 L40 20 L50 12 L60 14 L70 8 L80 6', sparkColor: 'oklch(0.78 0.16 145)' },
              { label: 'tiempo medio match', count: 2.4, decimals: 1, color: 'var(--warm)', suffix: 'h', delta: '↑ 18 min · más lento', deltaDir: 'dn',
                spark: 'M0 8 L10 12 L20 14 L30 10 L40 18 L50 14 L60 22 L70 20 L80 24', sparkColor: 'oklch(0.72 0.155 45)' },
            ].map((kpi, i) => (
              <div key={i} style={{
                padding: '24px 26px', borderRight: i < 3 ? '1px solid var(--line)' : '0',
                background: 'var(--bg-1)', position: 'relative',
              }}>
                <svg style={{ position: 'absolute', right: 18, top: 18, width: 80, height: 32, opacity: 0.85 }} viewBox="0 0 80 32" fill="none">
                  <path d={kpi.spark} stroke={kpi.sparkColor} strokeWidth="1.5" />
                </svg>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{kpi.label}</div>
                <div style={{ marginTop: 8, fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: kpi.color }}>
                  <span data-count={kpi.count} data-decimals={kpi.decimals ?? 0} data-suffix={kpi.suffix}>
                    {kpi.decimals ? kpi.count.toFixed(kpi.decimals) : kpi.count}{kpi.suffix}
                  </span>
                </div>
                <div style={{
                  marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                  padding: '3px 8px', borderRadius: 999,
                  color: kpi.deltaDir === 'up' ? 'var(--pos)' : 'var(--neg)',
                  background: kpi.deltaDir === 'up' ? 'oklch(0.78 0.16 145 / 0.1)' : 'oklch(0.68 0.20 25 / 0.1)',
                }}>{kpi.delta}</div>
              </div>
            ))}
          </section>

          {/* Map + Donut */}
          <section className="js-fade" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Map */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Mapa de respuestas por zona</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>CABA · CÍRCULOS = VOLUMEN · COLOR = TASA</span>
              </div>
              <div style={{ position: 'relative', height: 380, borderRadius: 12, overflow: 'hidden', background: 'oklch(0.13 0.005 80)' }}>
                <svg style={{ width: '100%', height: '100%', display: 'block' }} viewBox="0 0 600 380" preserveAspectRatio="none">
                  <defs>
                    <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M40 0 H0 V40" fill="none" stroke="oklch(0.20 0.008 80)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="600" height="380" fill="url(#g)" />
                  <path d="M520 0 Q470 60 460 140 Q455 230 480 320 L480 380 L600 380 L600 0 Z" fill="oklch(0.16 0.02 240)" opacity="0.5" />
                  <path d="M0 200 L600 180" stroke="oklch(0.22 0.008 80)" strokeWidth="2" strokeDasharray="4 6" />
                  <path d="M280 0 L320 380" stroke="oklch(0.22 0.008 80)" strokeWidth="2" strokeDasharray="4 6" />
                  <path d="M120 380 L200 0" stroke="oklch(0.22 0.008 80)" strokeWidth="1.5" strokeDasharray="4 6" />
                  <g transform="translate(380, 110)">
                    <circle r="48" fill="oklch(0.92 0.205 116 / 0.12)" stroke="oklch(0.92 0.205 116 / 0.4)" />
                    <circle r="32" fill="oklch(0.92 0.205 116 / 0.18)" />
                    <circle r="14" fill="oklch(0.92 0.205 116 / 0.85)" />
                    <text x="0" y="-58" fill="var(--fg)" fontFamily="Space Grotesk" fontSize="12" textAnchor="middle">Palermo · 47%</text>
                  </g>
                  <g transform="translate(280, 160)">
                    <circle r="38" fill="oklch(0.92 0.205 116 / 0.10)" stroke="oklch(0.92 0.205 116 / 0.35)" />
                    <circle r="22" fill="oklch(0.92 0.205 116 / 0.16)" />
                    <circle r="11" fill="oklch(0.92 0.205 116 / 0.7)" />
                    <text x="0" y="-46" fill="var(--fg)" fontFamily="Space Grotesk" fontSize="12" textAnchor="middle">Villa Crespo · 41%</text>
                  </g>
                  <g transform="translate(220, 240)">
                    <circle r="42" fill="oklch(0.72 0.155 45 / 0.10)" stroke="oklch(0.72 0.155 45 / 0.35)" />
                    <circle r="26" fill="oklch(0.72 0.155 45 / 0.18)" />
                    <circle r="13" fill="oklch(0.72 0.155 45 / 0.7)" />
                    <text x="0" y="-50" fill="var(--fg)" fontFamily="Space Grotesk" fontSize="12" textAnchor="middle">Caballito · 26%</text>
                  </g>
                  <g transform="translate(170, 175)">
                    <circle r="28" fill="oklch(0.72 0.155 45 / 0.08)" stroke="oklch(0.72 0.155 45 / 0.30)" />
                    <circle r="16" fill="oklch(0.72 0.155 45 / 0.16)" />
                    <circle r="8" fill="oklch(0.72 0.155 45 / 0.6)" />
                    <text x="0" y="-34" fill="var(--fg-1)" fontFamily="Space Grotesk" fontSize="11" textAnchor="middle">Almagro · 22%</text>
                  </g>
                  <g transform="translate(140, 290)">
                    <circle r="20" fill="oklch(0.68 0.20 25 / 0.08)" stroke="oklch(0.68 0.20 25 / 0.30)" />
                    <circle r="10" fill="oklch(0.68 0.20 25 / 0.16)" />
                    <circle r="6" fill="oklch(0.68 0.20 25 / 0.6)" />
                    <text x="0" y="-26" fill="var(--fg-1)" fontFamily="Space Grotesk" fontSize="11" textAnchor="middle">Boedo · 14%</text>
                  </g>
                  <g transform="translate(440, 60)">
                    <circle r="22" fill="oklch(0.92 0.205 116 / 0.08)" stroke="oklch(0.92 0.205 116 / 0.30)" />
                    <circle r="12" fill="oklch(0.92 0.205 116 / 0.14)" />
                    <circle r="6" fill="oklch(0.92 0.205 116 / 0.6)" />
                    <text x="0" y="-28" fill="var(--fg-1)" fontFamily="Space Grotesk" fontSize="11" textAnchor="middle">Belgrano · 35%</text>
                  </g>
                  <g transform="translate(40, 50)" fontFamily="JetBrains Mono" fontSize="9" fill="var(--fg-3)">
                    <text x="0" y="0">N</text>
                    <line x1="6" y1="-2" x2="6" y2="20" stroke="var(--fg-3)" strokeWidth="1" />
                    <polygon points="3,4 6,-4 9,4" fill="var(--acc)" />
                  </g>
                </svg>
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'oklch(0.11 0.005 80 / 0.85)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', minWidth: 220,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 4 }}>Palermo · sub-zonas</div>
                  {[['Contactados', '112'], ['Tasa', '47%'], ['Tiempo medio resp.', '1.2h'], ['Visitas', '9']].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, padding: '3px 0', color: 'var(--fg-2)' }}>
                      <span>{k}</span><b style={{ color: 'var(--acc)', fontWeight: 500 }}>{v}</b>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 14, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {[
                    { color: 'oklch(0.92 0.205 116 / 0.7)', label: 'RESPUESTA ALTA >35%' },
                    { color: 'oklch(0.72 0.155 45 / 0.7)', label: 'MEDIA 15–35%' },
                    { color: 'oklch(0.68 0.20 25 / 0.7)', label: 'BAJA <15%' },
                  ].map(({ color, label }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block' }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut — Por qué no escribió */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Por qué Casita NO escribió</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>388 LISTINGS DESCARTADOS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 22, alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 180, height: 180 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle r="40" cx="50" cy="50" fill="none" stroke="oklch(0.68 0.20 25)" strokeWidth="14" strokeDasharray="100.4 251" strokeDashoffset="0" />
                    <circle r="40" cx="50" cy="50" fill="none" stroke="oklch(0.72 0.155 45)" strokeWidth="14" strokeDasharray="72.8 251" strokeDashoffset="-100.4" />
                    <circle r="40" cx="50" cy="50" fill="none" stroke="oklch(0.55 0.10 80)" strokeWidth="14" strokeDasharray="44.2 251" strokeDashoffset="-173.2" />
                    <circle r="40" cx="50" cy="50" fill="none" stroke="oklch(0.40 0.06 80)" strokeWidth="14" strokeDasharray="33.6 251" strokeDashoffset="-217.4" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em' }}>388</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>descartados</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { color: 'oklch(0.68 0.20 25)', label: 'Contrafrente / sin luz',   v: '154 · 40%' },
                    { color: 'oklch(0.72 0.155 45)', label: 'Expensas escondidas',       v: '112 · 29%' },
                    { color: 'oklch(0.55 0.10 80)', label: 'Garante propietario',        v: '68 · 18%' },
                    { color: 'oklch(0.40 0.06 80)', label: 'Listing duplicado',          v: '31 · 8%' },
                    { color: 'oklch(0.30 0.04 80)', label: '"Ideal estudiante"',         v: '23 · 5%' },
                  ].map(({ color, label, v }) => (
                    <div key={label} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center', fontSize: 13 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: color, display: 'inline-block' }} />
                      <span>{label}</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--fg-2)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Funnel + Histogram */}
          <section className="js-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, marginBottom: 20 }}>
            {/* Funnel */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Embudo de la semana</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>DEL SCRAPE A LA VISITA</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Listings escaneados',        v: '3.412', pct: '100%', fill: 100 },
                  { label: 'Pasaron filtro IA',          v: '1.092', pct: '32%',  fill: 32 },
                  { label: 'Casita escribió',            v: '412',   pct: '12%',  fill: 12 },
                  { label: 'Respondieron',               v: '158',   pct: '4.6%', fill: 4.6, accent: true },
                  { label: 'Acuerdo tentativo',          v: '71',    pct: '2.1%', fill: 2.1 },
                  { label: 'Visita agendada con tu OK',  v: '21',    pct: '0.6%', fill: 0.6 },
                ].map(({ label, v, pct, fill, accent }) => (
                  <div key={label} style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center',
                    gap: 12, padding: '14px 16px', borderRadius: 10,
                    background: 'var(--bg-2)', position: 'relative', overflow: 'hidden',
                  }}>
                    <div className="fill" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill}%`, background: 'oklch(0.92 0.205 116 / 0.12)' }} />
                    <div style={{ position: 'relative', fontSize: 13, color: 'var(--fg)', fontWeight: 500, zIndex: 1 }}>{label}</div>
                    <div style={{ position: 'relative', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: accent ? 'var(--acc)' : 'var(--fg)', zIndex: 1 }}>{v}</div>
                    <div style={{ position: 'relative', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-2)', zIndex: 1, minWidth: 50, textAlign: 'right' }}>{pct}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histogram */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em' }}>Histograma de precios — 2 amb. en tus zonas</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>412 LISTINGS · ENE-MAY</span>
              </div>
              <div style={{ display: 'flex', gap: 18, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--acc)', verticalAlign: 'middle', marginRight: 6 }} />EN TU RANGO</span>
                <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--warm)', verticalAlign: 'middle', marginRight: 6 }} />FUERA DE RANGO</span>
                <span style={{ marginLeft: 'auto' }}>PROMEDIO: $ 712k</span>
                <span>MEDIANA: $ 685k</span>
              </div>
              <div className="hist" style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, alignItems: 'flex-end', height: 220, padding: '0 4px' }}>
                {[
                  { h: 12,  warm: true,  tip: '$300-350k · 4' },
                  { h: 18,  warm: true,  tip: '$350-400k · 12' },
                  { h: 28,  warm: true,  tip: '$400-450k · 26' },
                  { h: 42,  warm: false, tip: '$450-500k · 38' },
                  { h: 55,  warm: false, tip: '$500-550k · 49' },
                  { h: 78,  warm: false, tip: '$550-600k · 71' },
                  { h: 92,  warm: false, tip: '$600-650k · 88' },
                  { h: 100, warm: false, tip: '$650-700k · 96' },
                  { h: 84,  warm: false, tip: '$700-750k · 79' },
                  { h: 60,  warm: true,  tip: '$750-800k · 54' },
                  { h: 38,  warm: true,  tip: '$800-850k · 33' },
                  { h: 22,  warm: true,  tip: '$850-900k · 18' },
                  { h: 14,  warm: true,  tip: '$900-950k · 9' },
                  { h: 8,   warm: true,  tip: '$950k+ · 5' },
                ].map(({ h, warm, tip }, i) => (
                  <div key={i} className="bar" data-tip={tip} style={{
                    height: `${h}%`,
                    background: warm
                      ? 'linear-gradient(180deg, var(--warm), oklch(0.72 0.155 45 / 0.4))'
                      : 'linear-gradient(180deg, var(--acc), oklch(0.92 0.205 116 / 0.4))',
                    borderRadius: '4px 4px 0 0', minHeight: 4,
                  }} />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 4, marginTop: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: 'var(--fg-3)', textAlign: 'center', letterSpacing: '0.05em', padding: '0 4px' }}>
                {['300','350','400','450','500','550','600','650','700','750','800','850','900','950+'].map(l => <span key={l}>{l}</span>)}
              </div>
            </div>
          </section>

          {/* Bottom row: barlist + response time + why-list */}
          <section className="js-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Bar list */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Tasa de respuesta por zona</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>CONTACTADOS · RESP.</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { nm: 'Palermo',      pct: 47, ct: 112, warm: false },
                  { nm: 'Villa Crespo', pct: 41, ct: 68,  warm: false },
                  { nm: 'Belgrano',     pct: 35, ct: 42,  warm: false },
                  { nm: 'Caballito',    pct: 26, ct: 88,  warm: true },
                  { nm: 'Almagro',      pct: 22, ct: 54,  warm: true },
                  { nm: 'Boedo',        pct: 14, ct: 28,  warm: true },
                  { nm: 'San Telmo',    pct: 11, ct: 20,  warm: true },
                ].map(({ nm, pct, ct, warm }) => (
                  <div key={nm} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 60px 60px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--fg)' }}>{nm}</span>
                    <div style={{ position: 'relative', height: 8, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' }}>
                      <i className="barlist" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: warm ? 'var(--warm)' : 'var(--acc)', borderRadius: 999, display: 'block' }} />
                    </div>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--fg-1)', textAlign: 'right' }}>{pct}%</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', textAlign: 'right' }}>{ct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response time */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Tiempo hasta primera respuesta</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>DISTRIBUCIÓN</span>
              </div>
              <div>
                {[
                  { label: '< 30 min',    pct: 42, color: 'var(--acc)' },
                  { label: '30 min – 2h', pct: 28, color: 'oklch(0.92 0.205 116 / 0.6)' },
                  { label: '2h – 6h',     pct: 14, color: 'var(--warm)' },
                  { label: '6h – 24h',    pct: 9,  color: 'oklch(0.72 0.155 45 / 0.6)' },
                  { label: '+1 día',      pct: 7,  color: 'var(--neg)' },
                ].map(({ label, pct, color }, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '110px 1fr 70px',
                    alignItems: 'center', gap: 12,
                    padding: '10px 0', borderTop: i === 0 ? 0 : '1px solid var(--line)',
                    fontSize: 13,
                  }}>
                    <span>{label}</span>
                    <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-2)' }}>
                      <i className="response-row" style={{ display: 'block', height: '100%', width: `${pct}%`, background: color }} />
                    </div>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', textAlign: 'right', color: 'var(--fg-1)' }}>{pct}%</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>MEJOR HORA PARA ESCRIBIR</span>
                <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 500, color: 'var(--acc)' }}>11–13h · 18–20h</span>
              </div>
            </div>

            {/* Why list */}
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Top razones de descarte</h3>
                <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>RAW · 388 LISTINGS</span>
              </div>
              <div>
                {[
                  { desc: 'Contrafrente o sin luz natural',     sub: 'DETECTADO POR FOTOS Y TEXTO',  ct: 154, pct: '40%' },
                  { desc: 'Expensas >30% del alquiler',          sub: 'UMBRAL DE TU PERFIL',          ct: 112, pct: '29%' },
                  { desc: 'Garante propietario obligatorio',     sub: 'SIN ALTERNATIVA DE CAUCIÓN',   ct: 68,  pct: '18%' },
                  { desc: 'Listing duplicado en otro portal',    sub: 'UNIFICADO POR HASH',           ct: 31,  pct: '8%' },
                  { desc: '"Ideal estudiante" / temporario',     sub: 'HEURÍSTICA DE COPY',           ct: 23,  pct: '5%' },
                ].map(({ desc, sub, ct, pct }, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 70px 80px',
                    alignItems: 'center', gap: 14,
                    padding: '12px 0', borderTop: i === 0 ? 0 : '1px solid var(--line)',
                  }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--fg-1)' }}>{desc}</div>
                      <small style={{ display: 'block', color: 'var(--fg-3)', fontSize: 11, marginTop: 2, fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' }}>{sub}</small>
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: 'var(--neg)', textAlign: 'right' }}>{ct}</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'oklch(0.68 0.20 25 / 0.1)', color: 'var(--neg)', textAlign: 'center' }}>{pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Activity heatmap */}
          <section className="js-fade" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Actividad del bot · 7 días</h3>
              <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.05em' }}>CADA COLUMNA = DÍA · INTENSIDAD = MENSAJES POR HORA</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, height: 80 }}>
              {[
                [0, 1, 2, 3, 2, 0],
                [1, 2, 3, 4, 3, 1],
                [1, 3, 4, 4, 3, 2],
                [0, 2, 3, 3, 2, 1],
                [1, 2, 4, 4, 3, 2],
                [2, 3, 4, 4, 4, 3],
                [1, 2, 3, 3, 2, 1],
                [0, 1, 2, 3, 3, 2],
                [1, 3, 4, 4, 3, 1],
                [2, 3, 4, 4, 4, 2],
                [1, 2, 3, 3, 2, 1],
                [0, 1, 2, 3, 2, 0],
              ].map((col, ci) => (
                <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                  {col.map((level, ri) => {
                    const bg = level === 0 ? 'var(--bg-2)'
                      : level === 1 ? 'oklch(0.92 0.205 116 / 0.2)'
                      : level === 2 ? 'oklch(0.92 0.205 116 / 0.4)'
                      : level === 3 ? 'oklch(0.92 0.205 116 / 0.7)'
                      : 'var(--acc)';
                    return <div key={ri} style={{ flex: 1, borderRadius: 2, background: bg }} />;
                  })}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: 'var(--fg-3)', marginTop: 6, textAlign: 'center', letterSpacing: '0.05em' }}>
              {['VIE 03','SÁB 04','DOM 05','LUN 06','MAR 07','MIÉ 08','JUE 09','VIE 10','SÁB 11','DOM 12','LUN 13','HOY'].map(d => <span key={d}>{d}</span>)}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
