'use client';

import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import {
  Search, Layers, MessageSquare, Bell, BarChart2, Wand2,
  Mail, MessageCircle, MoreVertical, ArrowRight, Calendar, DollarSign, Clock,
} from 'lucide-react';

const SW = 1.6;

const navItems = [
  { id: 'home',       href: '/home',       label: 'Buscar',          ico: 'search', group: 'principal' },
  { id: 'feed',       href: '/feed',       label: 'Encontrados',     ico: 'stack',  badge: '24', group: 'principal' },
  { id: 'chats',      href: '/chats',      label: 'Conversaciones',  ico: 'chat',   badge: '8',  group: 'principal' },
  { id: 'pending',    href: '/pending',    label: 'Pendientes',      ico: 'bell',   badge: '3',  urgent: true, group: 'principal' },
  { id: 'dashboard',  href: '/dashboard',  label: 'Métricas',        ico: 'spark',  group: 'operación' },
  { id: 'onboarding', href: '/onboarding', label: 'Setup inicial',   ico: 'wand',   group: 'operación' },
] as const;

const navIcons: Record<string, React.ReactNode> = {
  search: <Search        size={16} strokeWidth={SW} />,
  stack:  <Layers        size={16} strokeWidth={SW} />,
  chat:   <MessageSquare size={16} strokeWidth={SW} />,
  bell:   <Bell          size={16} strokeWidth={SW} />,
  spark:  <BarChart2     size={16} strokeWidth={SW} />,
  wand:   <Wand2         size={16} strokeWidth={SW} />,
};

const avatarColors = [
  'oklch(0.35 0.12 180)',
  'oklch(0.32 0.10 290)',
  'oklch(0.30 0.08 45)',
  'oklch(0.33 0.11 130)',
  'oklch(0.31 0.09 320)',
  'oklch(0.34 0.12 200)',
  'oklch(0.32 0.10 60)',
  'oklch(0.30 0.11 260)',
  'oklch(0.35 0.08 100)',
  'oklch(0.31 0.10 15)',
];

interface Convo {
  id: number;
  name: string;
  initials: string;
  color: string;
  preview: string;
  propTag: string;
  time: string;
  unread?: number;
  active?: boolean;
  source: 'wa' | 'mail';
}

const convos: Convo[] = [
  { id: 1,  name: 'Federico Iturri',   initials: 'FI', color: avatarColors[0], preview: 'Sí, podemos coordinar la visita para el jueves a las 18 hs.',   propTag: 'Palermo 3A',  time: '18:42', unread: 2, active: true, source: 'wa' },
  { id: 2,  name: 'Inmob. Del Plata',  initials: 'DP', color: avatarColors[1], preview: 'Le adjunto el contrato actualizado con las condiciones acordadas.',  propTag: 'Belgrano 2B', time: '17:05', unread: 1, source: 'mail' },
  { id: 3,  name: 'Cecilia Romero',    initials: 'CR', color: avatarColors[2], preview: 'Por el momento el precio no es negociable.',                      propTag: 'Colegiales',  time: '14:30', source: 'wa' },
  { id: 4,  name: 'Prop. Martínez',    initials: 'PM', color: avatarColors[3], preview: 'Buenas tardes, me comunico por la consulta sobre el depto.',       propTag: 'Villa Crespo',time: 'Ayer',   source: 'wa' },
  { id: 5,  name: 'Diego Ferreyra',    initials: 'DF', color: avatarColors[4], preview: 'La visita quedó confirmada para el sábado a las 11.',             propTag: 'Núñez 4C',   time: 'Ayer',   source: 'wa' },
  { id: 6,  name: 'Inmob. Central BA', initials: 'CB', color: avatarColors[5], preview: 'Tenemos disponibilidad a partir de agosto. ¿Le interesa?',        propTag: 'Caballito',   time: 'Lun',    source: 'mail' },
  { id: 7,  name: 'Laura Sánchez',     initials: 'LS', color: avatarColors[6], preview: '¿Podrías enviarme más fotos de la terraza?',                      propTag: 'San Telmo',   time: 'Lun',    source: 'wa' },
  { id: 8,  name: 'Prop. González',    initials: 'PG', color: avatarColors[7], preview: 'El depto sigue disponible, sin embargo hay otras ofertas.',        propTag: 'Recoleta 1A', time: 'Dom',    source: 'wa' },
  { id: 9,  name: 'Hernán Villarreal', initials: 'HV', color: avatarColors[8], preview: 'Podría bajar $80.000 si firmamos antes de fin de mes.',           propTag: 'Flores',      time: 'Vie',    source: 'wa' },
  { id: 10, name: 'Inmob. Norte',      initials: 'IN', color: avatarColors[9], preview: 'Las expensas incluyen todos los servicios comunes.',               propTag: 'Saavedra',    time: 'Jue',    source: 'mail' },
];

const messages = [
  { id: 1,  dir: 'out', text: 'Buenas tardes, consulto por el departamento en Palermo. ¿Sigue disponible?',     ts: '09:14', day: null },
  { id: 2,  dir: 'in',  text: 'Sí, el departamento está disponible. ¿Cuándo le vendría bien visitarlo?',        ts: '09:31', day: 'HOY' },
  { id: 3,  dir: 'out', text: 'Podría ser esta semana. ¿Tienen horario el jueves a la tarde?',                  ts: '09:34', day: null },
  { id: 4,  dir: 'in',  text: 'El jueves tenemos disponibilidad de 17 a 19 hs. ¿Le viene bien las 18?',         ts: '10:02', day: null },
  { id: 5,  dir: 'out', text: 'Perfecto. Quería consultar también sobre el precio, ¿es negociable?',            ts: '10:05', day: null },
  { id: 6,  dir: 'in',  text: 'Hay algo de margen. ¿Qué número tiene en mente?',                               ts: '10:22', day: null },
  { id: 7,  dir: 'out', text: 'Pensaba en $850.000. El inmueble necesita algunas refacciones menores.',         ts: '10:25', day: null },
  { id: 8,  dir: 'system', text: 'OFERTA ENVIADA · $850.000',                                                  ts: '',     day: null },
  { id: 9,  dir: 'in',  text: 'Entiendo. Voy a consultarlo con el propietario y le aviso esta tarde.',         ts: '10:48', day: null },
  { id: 10, dir: 'out', text: 'Muchas gracias. Quedo a la espera.',                                             ts: '10:49', day: null },
  { id: 11, dir: 'in',  text: 'El propietario acepta $880.000, no puede bajar más porque tiene dos ofertas similares.', ts: '14:12', day: null },
  { id: 12, dir: 'out', text: 'Entendido. Podemos acordar en $865.000 como cifra final.',                       ts: '14:38', day: null },
  { id: 13, dir: 'in',  text: 'Sí, podemos coordinar la visita para el jueves a las 18 hs.',                   ts: '18:42', day: null },
];

const WaIcon  = () => <MessageCircle size={8} strokeWidth={2} />;
const MailIcon = () => <Mail          size={8} strokeWidth={2} />;

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
                className={`${item.id === 'chats' ? 'active' : ''} ${'urgent' in item && item.urgent ? 'urgent' : ''}`}
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
        <b>Conversaciones</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        Federico Iturri · Palermo 3A
      </div>
      <div className="right">
        <div className="pill">
          <span className="pulse" />
          BOT ACTIVO · 8 chats
        </div>
        <a href="/feed" className="btn btn-ghost">Ver propiedades</a>
        <a href="#" className="btn btn-acc">Conectar WhatsApp <span className="arrow">↗</span></a>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const [activeConvo, setActiveConvo] = useState(1);

  useEffect(() => {
    initAnimations();
  }, []);

  function initAnimations() {
    gsap.defaults({ ease: 'power3.out' });

    gsap.from('.side',   { x: -24, autoAlpha: 0, duration: 1.0 });
    gsap.from('.topbar', { y: -12, autoAlpha: 0, duration: 0.85, delay: 0.12 });

    // Convo items slide from left staggered
    gsap.from('.convo', {
      x: -20, autoAlpha: 0,
      duration: 0.65, ease: 'power2.out',
      stagger: 0.06, delay: 0.28,
    });

    // Thread header fades in
    gsap.from('.thread-head', {
      autoAlpha: 0, y: -10,
      duration: 0.7, delay: 0.4,
    });

    // Messages stagger from bottom
    gsap.from('.msg', {
      y: 18, autoAlpha: 0,
      duration: 0.55, ease: 'power2.out',
      stagger: 0.07, delay: 0.55,
    });

    // Context rail slides from right
    gsap.from('.ctx', {
      x: 32, autoAlpha: 0,
      duration: 0.85, ease: 'power2.out',
      delay: 0.35,
    });

    // Draft suggestion pops in
    gsap.from('.draft-suggest', {
      y: 10, autoAlpha: 0, scale: 0.97,
      duration: 0.65, ease: 'back.out(1.4)',
      delay: 1.2,
    });

    // Typing dots entrance
    gsap.from('.typing-row', {
      y: 10, autoAlpha: 0,
      duration: 0.55, delay: 1.45,
    });
  }

  return (
    <div className="app">
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main className="chats">

          {/* ── Conversation list ─────────────────────── */}
          <aside className="convo-list">
            <div className="cl-head">
              <h2>Conversaciones</h2>
              <div className="cl-search">
                <Search size={14} strokeWidth={SW} />
                <input type="text" placeholder="Buscar conversación…" />
              </div>
            </div>
            <div className="cl-filters">
              <button className="cl-pill on">Todos</button>
              <button className="cl-pill">Sin leer</button>
              <button className="cl-pill">En oferta</button>
            </div>
            <div className="cl-list">
              {convos.map((c) => (
                <div
                  key={c.id}
                  className={`convo${c.id === activeConvo ? ' active' : ''}`}
                  onClick={() => setActiveConvo(c.id)}
                >
                  <div className="av" style={{ background: c.color, color: 'var(--fg)' }}>
                    {c.initials}
                    <div
                      className="src-badge"
                      style={{
                        background: c.source === 'wa'
                          ? 'oklch(0.55 0.17 150)'
                          : 'oklch(0.40 0.10 260)',
                        color: 'var(--fg)',
                      }}
                    >
                      {c.source === 'wa' ? <WaIcon /> : <MailIcon />}
                    </div>
                  </div>
                  <div className="info">
                    <div className="row1">
                      <span className="name">{c.name}</span>
                      <span className="time">{c.time}</span>
                    </div>
                    <div className="preview">
                      <span className="prop-tag">{c.propTag}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.preview}
                      </span>
                    </div>
                  </div>
                  {c.unread && c.unread > 1
                    ? <span className="badge-count">{c.unread}</span>
                    : c.unread === 1
                    ? <span className="badge-dot" />
                    : null}
                </div>
              ))}
            </div>
          </aside>

          {/* ── Thread ───────────────────────────────── */}
          <section className="thread">
            <div className="thread-head">
              <div className="th-av" style={{ background: avatarColors[0], color: 'var(--fg)' }}>FI</div>
              <div className="th-info">
                <div className="th-name">Federico Iturri</div>
                <div className="th-sub">PALERMO 3A · $880.000 · EN NEGOCIACIÓN</div>
              </div>
              <div className="th-actions">
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                  Ver propiedad
                </button>
                <button className="icon-btn">
                  <MoreVertical size={14} strokeWidth={SW} />
                </button>
              </div>
            </div>

            <div className="msgs">
              {messages.map((m) => (
                <div key={m.id}>
                  {m.day && (
                    <div className="day-div">
                      <span>{m.day}</span>
                    </div>
                  )}
                  {m.dir === 'system' ? (
                    <div className="system">
                      <span>{m.text}</span>
                    </div>
                  ) : (
                    <div className={`msg ${m.dir}`}>
                      <div className="bubble">
                        {m.text}
                        {m.ts && <span className="ts">{m.ts}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="typing-row">
                <div
                  className="av-sm"
                  style={{ background: avatarColors[0], color: 'var(--fg)', fontSize: 10, fontWeight: 600 }}
                >
                  FI
                </div>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>

            <div className="draft-suggest">
              <span className="ds-label">Sugerencia IA</span>
              <span className="ds-text">&ldquo;Perfecto Federico, confirmo la visita para el jueves 15 a las 18 hs. ¡Hasta entonces!&rdquo;</span>
              <button className="btn btn-acc" style={{ fontSize: 11.5, padding: '5px 12px' }}>Usar</button>
            </div>

            <div className="thread-composer">
              <textarea rows={1} placeholder="Escribir mensaje…" />
              <button className="send-btn" aria-label="Enviar">
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </section>

          {/* ── Context rail ─────────────────────────── */}
          <aside className="ctx">
            {/* Property card */}
            <div className="ctx-card ctx-prop">
              <div className="prop-img">
                <div className="prop-img-ph">🏠</div>
              </div>
              <div className="prop-body">
                <div className="prop-name">Depto. 3 amb. Palermo</div>
                <div className="prop-addr">NICARAGUA 4800, PISO 3 · PALERMO</div>
                <div className="prop-price">$880.000</div>
                <div className="prop-tags">
                  <span className="prop-tag">70m²</span>
                  <span className="prop-tag">2 dorm</span>
                  <span className="prop-tag">1 baño</span>
                  <span className="prop-tag">balcón</span>
                </div>
              </div>
            </div>

            {/* Negotiation stats */}
            <div className="ctx-card ctx-stats">
              <h4>Negociación</h4>
              <div className="ctx-row">
                <span>Precio publicado</span>
                <span className="val">$880.000</span>
              </div>
              <div className="ctx-row">
                <span>Última oferta</span>
                <span className="val warm">$865.000</span>
              </div>
              <div className="ctx-row">
                <span>Diferencia</span>
                <span className="val">−1.7%</span>
              </div>
              <div className="ctx-row">
                <span>Estado</span>
                <span className="val acc">En negociación</span>
              </div>
              <div className="ctx-row">
                <span>Mensajes</span>
                <span className="val">13</span>
              </div>
              <div className="ctx-row">
                <span>Respuesta prom.</span>
                <span className="val">~28 min</span>
              </div>
            </div>

            {/* Detected intents */}
            <div className="ctx-card ctx-intents">
              <h4>Intenciones detectadas</h4>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.25 0.08 116)', color: 'var(--acc)' }}
                >
                  <Calendar size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">Visita coordinada</div>
                  <div className="intent-sub">Jueves 15 · 18:00 hs</div>
                </div>
              </div>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.25 0.08 45)', color: 'var(--warm)' }}
                >
                  <DollarSign size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">Propuesta de precio</div>
                  <div className="intent-sub">$865.000 pendiente</div>
                </div>
              </div>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.22 0.06 220)', color: 'var(--fg-2)' }}
                >
                  <Clock size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">Consulta abierta</div>
                  <div className="intent-sub">Condiciones del contrato</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ctx-card ctx-actions">
              <h4>Acciones rápidas</h4>
              <button className="btn btn-acc" style={{ justifyContent: 'center' }}>
                Confirmar visita
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 12.5 }}>
                Enviar contrapropuesta
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 12.5, color: 'var(--neg)' }}>
                Descartar propiedad
              </button>
            </div>
          </aside>

        </main>
      </div>
    </div>
  );
}
