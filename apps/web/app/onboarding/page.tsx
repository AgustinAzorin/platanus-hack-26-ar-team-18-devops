'use client';

import { useEffect, useState } from 'react';
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
                className={`${item.id === 'onboarding' ? 'active' : ''} ${'urgent' in item && item.urgent ? 'urgent' : ''}`}
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
        <b>Setup inicial</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        paso 3 de 5
      </div>
      <div className="right">
        <a href="/home" className="btn btn-ghost">Volver al chat</a>
      </div>
    </div>
  );
}

const TONES = [
  { id: 'formal',    label: 'Formal',           hint: '"Buenas tardes, vi su publicación..."', preview: 'Buenas tardes, vi su publicación del 2 amb. en Villa Crespo. Le escribo de parte de Martina Ríos, quien está buscando departamento para el 1° de junio. ¿Continúa disponible para coordinar una visita?' },
  { id: 'canchero',  label: 'Canchero porteño', hint: '"Hola! qué tal? vi tu aviso..."',        preview: 'Hola Federico! qué tal? vi tu aviso del 2 amb en Villa Crespo. Te escribo de parte de Martina que está buscando para junio. ¿Sigue disponible? La idea es coordinar una visita esta semana 🙏' },
  { id: 'directo',   label: 'Directo',           hint: '"Hola, ¿el 2amb sigue libre?"',          preview: 'Hola, ¿el 2amb sigue libre? Busco para junio, mascotas ok. ¿Puedo ver esta semana?' },
];

export default function OnboardingPage() {
  const [activeTone, setActiveTone] = useState('canchero');
  const [zones, setZones] = useState(['Palermo Soho', 'Villa Crespo', 'Caballito']);
  const [musts, setMusts] = useState(['Mascotas OK', 'Luz natural', 'Cocina separada', 'Sin garante propietario']);
  const [discards, setDiscards] = useState(['Contrafrente', 'PB sin patio', '"Ideal estudiante"']);
  const [sources, setSources] = useState(['ArgenProp', 'Zonaprop', 'Mercado Libre']);

  const allZones = ['Palermo Soho', 'Villa Crespo', 'Caballito', 'Almagro', 'Boedo', 'Núñez'];
  const allMusts = ['Mascotas OK', 'Luz natural', 'Cocina separada', 'Balcón', 'Cochera', 'Sin garante propietario'];
  const allDiscards = ['Contrafrente', 'PB sin patio', '"Ideal estudiante"'];
  const allSources = [
    { id: 'ArgenProp',    interval: 'CADA 6 MIN',    stats: '12.412 listings activos' },
    { id: 'Zonaprop',     interval: 'CADA 6 MIN',    stats: '9.880 listings activos' },
    { id: 'Mercado Libre',interval: 'CADA 12 MIN',   stats: '6.301 listings activos' },
    { id: 'InmoBaires',   interval: 'DESCONECTADO',  stats: 'menor cobertura' },
  ];

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

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
    gsap.fromTo('.progress-fill', { width: '0%' }, { width: '60%', duration: 1.2, ease: 'power3.out', delay: 0.2 });
  }

  const currentTone = TONES.find(t => t.id === activeTone)!;

  return (
    <div className="app">
      <Sidebar />
      <div>
        <Topbar />
        <main style={{ padding: '48px 56px 80px', position: 'relative', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>

            {/* Header */}
            <header className="js-fade" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
              <h1 style={{ margin: 0, fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
                Configurá <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--fg-2)' }}>cómo</span><br />
                quiere buscar Casita.
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-2)', letterSpacing: '0.1em' }}>
                <span>3 / 5</span>
                <div style={{ width: 220, height: 3, background: 'var(--bg-2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div className="progress-fill" style={{ height: '100%', background: 'var(--acc)', width: '60%' }} />
                </div>
                <span>~4 min restantes</span>
              </div>
            </header>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 32 }}>

              {/* Stepper */}
              <aside className="js-fade" style={{ position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { n: 1, label: 'Conectar cuenta',      sub: 'Casita inicia sesión por vos',   state: 'done' },
                    { n: 2, label: 'Canales de contacto',  sub: 'WhatsApp, mail, teléfono',        state: 'done' },
                    { n: 3, label: 'Criterios y descartes',sub: 'Lo que buscás y lo que NO',       state: 'active' },
                    { n: 4, label: 'Tono del bot',         sub: 'Formal, canchero o directo',      state: 'upcoming' },
                    { n: 5, label: 'Reglas de aprobación', sub: 'Qué necesita tu OK',              state: 'upcoming' },
                  ].map(({ n, label, sub, state }) => (
                    <li key={n} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      color: state === 'upcoming' ? 'var(--fg-3)' : 'var(--fg)',
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: (state === 'done' || state === 'active') ? '1px solid var(--acc)' : '1px solid var(--line)',
                        background: (state === 'done' || state === 'active') ? 'var(--acc)' : 'transparent',
                        color: (state === 'done' || state === 'active') ? 'var(--acc-ink)' : 'var(--fg-3)',
                        display: 'grid', placeItems: 'center',
                        fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
                      }}>
                        {state === 'done' ? '✓' : n}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: state === 'upcoming' ? 'var(--fg-3)' : 'var(--fg)' }}>{label}</div>
                        <small style={{ display: 'block', fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{sub}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>

              {/* Panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Channels */}
                <section className="js-fade" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '28px 30px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>Canales conectados</h3>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14, margin: '0 0 20px', maxWidth: '60ch' }}>
                    Casita usa estas cuentas para contactar a los dueños. Podés desconectar cuando quieras y nada se pierde — el historial queda guardado.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { title: 'WhatsApp Business', meta: '+54 11 5 555 0921', state: 'Activo · 142 mensajes hoy', active: true,
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}><path d="M5 4h14v16l-3-2H5z"/></svg> },
                      { title: 'Mail', meta: 'martina@casita.app', state: 'Activo · responde dentro de 6h', active: true,
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="m3 8 9 6 9-6"/></svg> },
                      { title: 'Llamadas', meta: 'opcional', state: 'No conectado · sólo para casos urgentes', active: false, warn: true,
                        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 18, height: 18 }}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg> },
                    ].map(({ title, meta, state, active, warn, icon }) => (
                      <div key={title} style={{
                        border: `1px solid ${active ? 'var(--acc)' : 'var(--line)'}`,
                        borderRadius: 'var(--r-2)', padding: 18,
                        background: active ? 'oklch(0.92 0.205 116 / 0.05)' : 'var(--bg)',
                        display: 'flex', flexDirection: 'column', gap: 12, position: 'relative',
                      }}>
                        {active && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: 'var(--acc)' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: active ? 'var(--acc)' : 'var(--bg-2)',
                            color: active ? 'var(--acc-ink)' : 'var(--fg-1)',
                            display: 'grid', placeItems: 'center',
                          }}>{icon}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 14 }}>{title}</div>
                            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{meta}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: warn ? 'var(--fg-2)' : 'var(--fg-2)' }}>
                          {active ? <><b style={{ color: 'var(--pos)' }}>Activo</b>{state.replace('Activo', '')}</> : <><b style={{ color: 'var(--warm)' }}>No conectado</b>{state.replace('No conectado', '')}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Sources */}
                <section className="js-fade" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '28px 30px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>Fuentes de propiedades</h3>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14, margin: '0 0 20px', maxWidth: '60ch' }}>
                    Elegí qué portales escanear. Casita unifica formatos, detecta duplicados y trae a una sola vista. <b style={{ color: 'var(--fg-1)', fontWeight: 500 }}>Recomendado: los 4 activos.</b>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {allSources.map(({ id, interval, stats }) => {
                      const on = sources.includes(id);
                      return (
                        <div key={id} onClick={() => setSources(s => toggle(s, id))} style={{
                          border: `1px solid ${on ? 'var(--acc)' : 'var(--line)'}`,
                          borderRadius: 12, padding: 16,
                          background: on ? 'oklch(0.92 0.205 116 / 0.04)' : 'var(--bg)',
                          display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer',
                        }}>
                          <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {id}
                            <div style={{
                              width: 28, height: 16, borderRadius: 999,
                              background: on ? 'var(--acc)' : 'var(--bg-3)',
                              position: 'relative', marginLeft: 'auto', transition: 'background 150ms',
                            }}>
                              <div style={{
                                position: 'absolute', left: on ? 14 : 2, top: 2, width: 12, height: 12, borderRadius: '50%',
                                background: on ? 'var(--acc-ink)' : 'white', transition: 'left 150ms',
                              }} />
                            </div>
                          </div>
                          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.1em' }}>{interval}</div>
                          <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{stats}</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Search criteria */}
                <section className="js-fade" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '28px 30px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>Criterios principales</h3>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14, margin: '0 0 20px', maxWidth: '60ch' }}>
                    Después podés tunear cada búsqueda desde el chat — esto es la base para todas.
                  </p>

                  {[
                    {
                      label: 'Zonas preferidas', sub: 'en orden',
                      content: (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {allZones.map(z => (
                            <span key={z} onClick={() => setZones(a => toggle(a, z))} style={{
                              padding: '9px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', userSelect: 'none',
                              border: `1px solid ${zones.includes(z) ? 'var(--acc)' : 'var(--line)'}`,
                              background: zones.includes(z) ? 'var(--acc)' : 'var(--bg)',
                              color: zones.includes(z) ? 'var(--acc-ink)' : 'var(--fg-1)',
                            }}>{z}</span>
                          ))}
                          <span style={{ padding: '9px 14px', borderRadius: 999, fontSize: 13, border: '1px solid var(--line)', color: 'var(--fg-1)', background: 'var(--bg)', cursor: 'pointer' }}>+ agregar</span>
                        </div>
                      ),
                    },
                    {
                      label: 'Presupuesto', sub: 'alquiler mensual',
                      content: (
                        <div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <input defaultValue="$ 480.000" style={{ flex: 1, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, outline: 'none', color: 'var(--fg)' }} />
                            <span style={{ color: 'var(--fg-3)', fontSize: 13, fontFamily: '"JetBrains Mono", monospace' }}>→</span>
                            <input defaultValue="$ 750.000" style={{ flex: 1, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 14, outline: 'none', color: 'var(--fg)' }} />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 8 }}>Casita penaliza listings que escondan expensas mayores a 30% del alquiler.</div>
                        </div>
                      ),
                    },
                    {
                      label: 'Imprescindibles', sub: undefined,
                      content: (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {allMusts.map(m => (
                            <span key={m} onClick={() => setMusts(a => toggle(a, m))} style={{
                              padding: '9px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', userSelect: 'none',
                              border: `1px solid ${musts.includes(m) ? 'var(--acc)' : 'var(--line)'}`,
                              background: musts.includes(m) ? 'var(--acc)' : 'var(--bg)',
                              color: musts.includes(m) ? 'var(--acc-ink)' : 'var(--fg-1)',
                            }}>{m}</span>
                          ))}
                        </div>
                      ),
                    },
                    {
                      label: 'Descartar siempre', sub: 'la IA no escribe',
                      content: (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {allDiscards.map(d => (
                            <span key={d} onClick={() => setDiscards(a => toggle(a, d))} style={{
                              padding: '9px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer', userSelect: 'none',
                              border: `1px solid ${discards.includes(d) ? 'oklch(0.68 0.20 25 / 0.4)' : 'var(--line)'}`,
                              background: discards.includes(d) ? 'oklch(0.68 0.20 25 / 0.15)' : 'var(--bg)',
                              color: discards.includes(d) ? 'var(--neg)' : 'var(--fg-1)',
                            }}>{d}</span>
                          ))}
                          <span style={{ padding: '9px 14px', borderRadius: 999, fontSize: 13, border: '1px solid var(--line)', color: 'var(--fg-1)', background: 'var(--bg)', cursor: 'pointer' }}>+ agregar regla</span>
                        </div>
                      ),
                    },
                  ].map(({ label, sub, content }, i) => (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24,
                      padding: '18px 0', borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                        {sub && <small style={{ display: 'block', color: 'var(--fg-3)', fontWeight: 400, marginTop: 4, fontSize: 12 }}>{sub}</small>}
                      </div>
                      <div>{content}</div>
                    </div>
                  ))}
                </section>

                {/* Tone */}
                <section className="js-fade" style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', padding: '28px 30px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>Tono del bot</h3>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14, margin: '0 0 20px', maxWidth: '60ch' }}>
                    Cómo te suena Casita cuando habla por vos. Podés escuchar el preview en el cuadrito del costado.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {TONES.map(t => (
                        <div key={t.id} onClick={() => setActiveTone(t.id)} style={{
                          padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          border: `1px solid ${activeTone === t.id ? 'var(--acc)' : 'var(--line)'}`,
                          background: activeTone === t.id ? 'oklch(0.92 0.205 116 / 0.05)' : 'var(--bg)',
                          fontSize: 14,
                        }}>
                          {t.label}
                          <small style={{ display: 'block', color: 'var(--fg-3)', fontSize: 11, marginTop: 2 }}>{t.hint}</small>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 18, minHeight: 180, position: 'relative' }}>
                      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                        PREVIEW · {TONES.find(t => t.id === activeTone)?.label.toUpperCase()}
                      </div>
                      <div style={{
                        background: 'var(--whats)', color: 'oklch(0.16 0.04 150)',
                        padding: '12px 14px', borderRadius: '12px 12px 12px 4px',
                        maxWidth: '80%', fontSize: 13.5, lineHeight: 1.45,
                      }}>
                        {currentTone.preview}
                        <small style={{ display: 'block', marginTop: 6, opacity: 0.6, fontSize: 10 }}>09:42 · enviado</small>
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
                        {[0, 150, 300].map((delay) => (
                          <div key={delay} style={{
                            width: 6, height: 6, background: 'var(--fg-3)', borderRadius: '50%',
                            animation: `bb 1s ${delay}ms infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 0', borderTop: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--fg-2)', fontSize: 13 }}>Podés cambiar todo después en <b>Configuración del bot</b>.</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost">← Atrás</button>
                    <a href="/home" className="btn btn-acc">Continuar <span>→</span></a>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <style>{`
            @keyframes bb { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
          `}</style>
        </main>
      </div>
    </div>
  );
}
