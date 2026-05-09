'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { Search, Layers, MessageSquare, Bell, BarChart2, Wand2, Heart } from 'lucide-react';

const SW = 1.6;

const navIcons: Record<string, React.ReactNode> = {
  search: <Search       size={16} strokeWidth={SW} />,
  stack:  <Layers       size={16} strokeWidth={SW} />,
  chat:   <MessageSquare size={16} strokeWidth={SW} />,
  bell:   <Bell         size={16} strokeWidth={SW} />,
  spark:  <BarChart2    size={16} strokeWidth={SW} />,
  wand:   <Wand2        size={16} strokeWidth={SW} />,
};

const navItems = [
  { id: 'home',      href: '/home',      label: 'Buscar',        ico: 'search', group: 'principal' },
  { id: 'feed',      href: '/feed',      label: 'Encontrados',   ico: 'stack',  badge: '24', group: 'principal' },
  { id: 'chats',     href: '/chats',     label: 'Conversaciones',ico: 'chat',   badge: '8',  group: 'principal' },
  { id: 'pending',   href: '/pending',   label: 'Pendientes',    ico: 'bell',   badge: '3',  urgent: true, group: 'principal' },
  { id: 'dashboard', href: '/dashboard', label: 'Métricas',      ico: 'spark',  group: 'operación' },
  { id: 'onboarding',href: '/onboarding',label: 'Setup inicial', ico: 'wand',   group: 'operación' },
] as const;

const heartSvg = <Heart size={14} strokeWidth={SW} />;

type CardStatus = 'contacted' | 'responded' | 'discarded' | 'pending';

interface CardData {
  photo: string; src: string; score: number; scoreClass?: string;
  title: string; addr: string; price: string; exp: string;
  specs: string[]; heart?: boolean;
  status: CardStatus;
  statusText: React.ReactNode;
  actions: { label: string; cls: string; href: string }[];
  discarded?: boolean;
}

const cards: CardData[] = [
  {
    photo: 'FOTO · LIVING', src: 'argenprop', score: 94, heart: true,
    title: '2 amb. luminoso · contrafrente al patio',
    addr: 'Aguirre 800 · Villa Crespo',
    price: '$ 720k', exp: '+ $ 92k expensas',
    specs: ['54 m²', '2 amb', '3° piso', 'balcón'],
    status: 'responded',
    statusText: <><b style={{ color: 'var(--pos)' }}>Respondió Federico</b> · propuso jueves 16hs</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
  {
    photo: 'FOTO · COCINA', src: 'zonaprop', score: 89,
    title: '2 amb. con cocina separada y patio',
    addr: 'Mario Bravo 1100 · Palermo Soho',
    price: '$ 685k', exp: '+ $ 64k expensas',
    specs: ['48 m²', '2 amb', 'PB', 'patio'],
    status: 'contacted',
    statusText: <>Casita escribió <b>hace 14 min</b> · esperando</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
  {
    photo: 'FOTO · BALCÓN', src: 'argenprop', score: 87,
    title: 'Monoamb. amplio convertido en 2 amb.',
    addr: 'Acuña de Figueroa 600 · Almagro',
    price: '$ 540k', exp: '+ $ 48k expensas',
    specs: ['42 m²', '1.5 amb', '5° piso', 'balcón'],
    status: 'pending',
    statusText: <><b style={{ color: 'var(--warm)' }}>Pendiente tu OK</b> · escribir a Soledad</>,
    actions: [{ label: 'Aprobar', cls: 'btn btn-warm', href: '/pending' }, { label: 'Ver detalle', cls: 'btn btn-ink', href: '/property' }],
  },
  {
    photo: 'FOTO · DORMITORIO', src: 'm. libre', score: 82,
    title: '2 amb. al frente, edificio reciclado',
    addr: 'Hidalgo 600 · Caballito Norte',
    price: '$ 615k', exp: '+ $ 71k expensas',
    specs: ['50 m²', '2 amb', '2° piso', 'luz'],
    status: 'contacted',
    statusText: <>Casita llamó <b>hace 1 h</b> · sin atender</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
  {
    photo: 'FOTO · LIVING', src: 'zonaprop', score: 78,
    title: '2 amb. coqueto · piso bajo, luminoso',
    addr: 'Loyola 1200 · Villa Crespo',
    price: '$ 590k', exp: '+ $ 55k expensas',
    specs: ['44 m²', '2 amb', '1° piso', 'terraza'],
    status: 'responded',
    statusText: <><b style={{ color: 'var(--pos)' }}>Mariana confirmó</b> · libre desde 1 jun</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
  {
    photo: 'FOTO · CONTRAFRENTE', src: 'argenprop', score: 31, scoreClass: 'bad', discarded: true,
    title: '2 amb. interno, "ideal estudiante"',
    addr: 'Av. Rivadavia 5400 · Caballito',
    price: '$ 880k', exp: '+ $ 140k expensas',
    specs: ['38 m²', '2 amb', '4° piso'],
    status: 'discarded',
    statusText: <><b style={{ color: 'var(--neg)' }}>Descartado por la IA</b> · contrafrente +18% sobre tu tope</>,
    actions: [{ label: 'Forzar contacto', cls: 'btn btn-ghost', href: '#' }, { label: 'Ver razón', cls: 'btn btn-ink', href: '/property' }],
  },
  {
    photo: 'FOTO · FACHADA', src: 'argenprop', score: 71, scoreClass: 'warn',
    title: '2 amb. en PH reciclado, planta alta',
    addr: 'Honduras 4200 · Palermo Soho',
    price: '$ 745k', exp: '+ $ 38k expensas',
    specs: ['52 m²', '2 amb', 'PA', 'terraza'],
    status: 'contacted',
    statusText: <>Casita escribió <b>hace 26 min</b> · esperando</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
  {
    photo: 'FOTO · COCINA', src: 'zonaprop', score: 85,
    title: '2 amb. con cochera y baulera',
    addr: 'Av. Córdoba 4800 · Almagro',
    price: '$ 670k', exp: '+ $ 78k expensas',
    specs: ['58 m²', '2 amb', '6° piso', 'cochera'],
    status: 'pending',
    statusText: <><b style={{ color: 'var(--warm)' }}>Pendiente tu OK</b> · escribir al titular</>,
    actions: [{ label: 'Aprobar', cls: 'btn btn-warm', href: '/pending' }, { label: 'Ver detalle', cls: 'btn btn-ink', href: '/property' }],
  },
  {
    photo: 'FOTO · LIVING', src: 'm. libre', score: 76,
    title: '2 amb. ladrillo a la vista, luminoso',
    addr: 'Bonpland 2100 · Palermo Hollywood',
    price: '$ 730k', exp: '+ $ 88k expensas',
    specs: ['50 m²', '2 amb', '2° piso'],
    status: 'contacted',
    statusText: <>Casita escribió <b>hace 3 h</b> · sin respuesta</>,
    actions: [{ label: 'Ver detalle', cls: 'btn btn-acc', href: '/property' }, { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' }],
  },
];

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
              <a key={item.id} href={item.href}
                className={`${item.id === 'feed' ? 'active' : ''} ${'urgent' in item && item.urgent ? 'urgent' : ''}`}>
                <span className="ico">{navIcons[item.ico]}</span>
                <span>{item.label}</span>
                {'badge' in item && item.badge && <span className="badge">{item.badge}</span>}
              </a>
            ))}
          </div>
        </div>
      ))}
      <div className="side-foot">
        <div className="user">
          <div className="avatar">M</div>
          <div className="who">Martina Ríos<small>Plan agente · BA</small></div>
          <div className="status" title="Bot activo" />
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <div className="topbar">
      <div className="crumb"><b>Encontrados</b><span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>24 propiedades</div>
      <div className="right">
        <div className="pill"><span className="pulse" />BOT ACTIVO · 3 búsquedas</div>
        <a href="/home" className="btn btn-ghost">Nueva búsqueda</a>
      </div>
    </div>
  );
}

export default function FeedPage() {
  useEffect(() => {
    initAnimations();

    function initAnimations() {
      gsap.defaults({ ease: 'power3.out' });

      gsap.from('.side',   { x: -24, autoAlpha: 0, duration: 1.0 });
      gsap.from('.topbar', { y: -12, autoAlpha: 0, duration: 0.85, delay: 0.15 });
      gsap.from('.feed-head', { autoAlpha: 0, y: 32, duration: 1.0, delay: 0.28 });
      gsap.from('.filters',   { autoAlpha: 0, y: 16, duration: 0.7, delay: 0.5 });
      gsap.from('.meta-row',  { autoAlpha: 0, y: 10, duration: 0.6, delay: 0.68 });

      gsap.from('.pcard', {
        autoAlpha: 0, y: 40, scale: 0.97,
        duration: 0.8, ease: 'power2.out',
        stagger: { amount: 0.85, from: 'start' },
        delay: 0.8,
      });

      gsap.from('.rcard', {
        autoAlpha: 0, x: 30,
        duration: 0.75, ease: 'power2.out',
        stagger: 0.14, delay: 1.1,
      });

      // Card hover tilt
      document.querySelectorAll<HTMLElement>('.pcard').forEach(card => {
        card.addEventListener('mouseenter', () =>
          gsap.to(card, { y: -4, scale: 1.01, duration: 0.25, ease: 'power2.out' }),
        );
        card.addEventListener('mouseleave', () =>
          gsap.to(card, { y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }),
        );
      });
    }
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <div>
        <Topbar />
        <main className="feed">

          <header className="feed-head">
            <div>
              <div className="eyebrow"><span className="dot" />BÚSQUEDA ACTIVA · 2 amb · Palermo + Villa Crespo + Caballito</div>
              <h1 style={{ marginTop: 18 }}><span className="acc">24</span> propiedades<br />filtradas <span className="it">para vos</span></h1>
              <p className="sub">De 412 listings encontrados, Casita descartó 388 por contrafrente, expensas escondidas, fotos repetidas o requisitos imposibles. Estos quedaron.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-ghost">Exportar</button>
              <button className="btn btn-acc">Refrescar ahora <span className="arrow">↻</span></button>
            </div>
          </header>

          <div className="filters">
            <div className="grp">
              <span className="f-chip on">Todas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>24</span></span>
              <span className="f-chip">Sin contactar <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>9</span></span>
              <span className="f-chip">Esperando respuesta <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>6</span></span>
              <span className="f-chip acc">Respondieron <span className="mono" style={{ marginLeft: 4 }}>5</span></span>
              <span className="f-chip">Descartadas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>4</span></span>
            </div>
            <div className="grp">
              <span className="f-chip">ArgenProp</span>
              <span className="f-chip">Zonaprop</span>
              <span className="f-chip">M. Libre</span>
            </div>
            <div className="right">
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Ordenar:</span>
              <div className="seg">
                <button className="on">Match</button>
                <button>Precio ↑</button>
                <button>Recientes</button>
              </div>
            </div>
          </div>

          <div className="feed-layout">
            <div>
              <div className="meta-row">
                <span><b>24</b> resultados</span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>actualizado hace <b>2 min</b></span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>3 búsquedas activas</span>
              </div>

              <div className="cards">
                {cards.map((c, i) => (
                  <article key={i} className={`pcard${c.discarded ? ' discarded' : ''}`}>
                    <div className="img-wrap">
                      <div className="ph-img"><span className="ph-label">{c.photo}</span></div>
                      <div className="img-overlay">
                        <div className="top-row">
                          <span className="src">{c.src}</span>
                          <span className={`score${c.scoreClass ? ` ${c.scoreClass}` : ''}`}>{c.score}</span>
                          {c.heart && <button className="heart">{heartSvg}</button>}
                        </div>
                      </div>
                    </div>
                    <div className="body">
                      <h4>{c.title}</h4>
                      <div className="addr">{c.addr}</div>
                      <div className="price">
                        <span className="num">{c.price}</span>
                        <span className="exp">{c.exp}</span>
                      </div>
                      <div className="specs">
                        {c.specs.map((s, j) => <span key={j}>{s}</span>)}
                      </div>
                      <div className={`status-row ${c.status}`}>
                        <span className="sdot" />
                        <span>{c.statusText}</span>
                      </div>
                      <div className="card-actions">
                        {c.actions.map((a, j) => (
                          <a key={j} href={a.href} className={a.cls}>{a.label}</a>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-ghost">Cargar 15 más</button>
              </div>
            </div>

            <aside className="rail">
              <div className="rcard">
                <h4>Resumen de la búsqueda</h4>
                {[
                  { k: 'Listings escaneados', v: '412' },
                  { k: 'Pasaron filtro IA',   v: '24',  cls: 'acc' },
                  { k: 'Contactados',          v: '15' },
                  { k: 'Respondieron',         v: '5',   cls: 'acc' },
                  { k: 'Pendientes tu OK',     v: '3',   cls: 'warm' },
                  { k: 'Descartados',          v: '4' },
                ].map((s, i) => (
                  <div key={i} className="rstat">
                    <span className="k">{s.k}</span>
                    <span className={`v${s.cls ? ` ${s.cls}` : ''}`}>{s.v}</span>
                  </div>
                ))}
              </div>

              <div className="rcard">
                <h4>Por qué se descartaron</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  {[
                    [154, 'Contrafrente o sin luz natural'],
                    [112, 'Expensas escondidas >30%'],
                    [68,  'Garante propietario obligatorio'],
                    [31,  'Fotos repetidas / dudosas'],
                    [23,  '"Ideal estudiante"'],
                  ].map(([n, label], i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span className="tag bad" style={{ marginTop: 2 }}>{n}</span>
                      <span style={{ color: 'var(--fg-1)' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rcard" style={{ background: 'oklch(0.92 0.205 116 / 0.06)', borderColor: 'oklch(0.92 0.205 116 / 0.3)' }}>
                <h4 style={{ color: 'var(--acc)' }}>Casita está trabajando</h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5 }}>
                  3 mensajes en cola. Próximo refresco en <span className="mono">04:12</span>.
                </p>
                <a href="/chats" className="btn btn-acc" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
                  Ver conversaciones
                </a>
              </div>
            </aside>
          </div>

        </main>
      </div>
    </div>
  );
}
