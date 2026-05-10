'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { Heart } from 'lucide-react';

import type { FeedCard, FeedSummary } from './data';
import AppSidebar from '../../components/app-sidebar';

const SW = 1.6;

function Topbar({ count }: { count: number }) {
  return (
    <div className="topbar">
      <div className="crumb"><b>Encontrados</b><span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>{count} propiedades</div>
      <div className="right">
        <div className="pill"><span className="pulse" />BOT ACTIVO · 3 búsquedas</div>
        <a href="/home" className="btn btn-ghost">Nueva búsqueda</a>
      </div>
    </div>
  );
}

const MOCK_NAMES = ['Federico', 'Soledad', 'Mariana', 'Lucas', 'Cecilia', 'Diego', 'Laura', 'Hernán'];

function statusContent(card: FeedCard) {
  const name = MOCK_NAMES[Number(card.id) % MOCK_NAMES.length] ?? 'Federico';
  const minutes = card.statusMin;
  const timeLabel =
    minutes < 60 ? `hace ${minutes} min` :
    minutes < 240 ? `hace ${Math.round(minutes / 60)} h` :
    'ayer';

  switch (card.statusKind) {
    case 'responded-fed':
      return <><b style={{ color: 'var(--pos)' }}>Respondió {name}</b> · propuso jueves 16hs</>;
    case 'casita-wrote':
      return <>Casita escribió <b>{timeLabel}</b> · esperando</>;
    case 'pending':
      return <><b style={{ color: 'var(--warm)' }}>Pendiente tu OK</b> · escribir a {name}</>;
    case 'casita-called':
      return <>Casita llamó <b>{timeLabel}</b> · sin atender</>;
    case 'mariana':
      return <><b style={{ color: 'var(--pos)' }}>{name} confirmó</b> · libre desde 1 jun</>;
    case 'discarded':
      return <><b style={{ color: 'var(--neg)' }}>Descartado por la IA</b> · contrafrente +18% sobre tu tope</>;
    case 'casita-no-response':
      return <>Casita escribió <b>{timeLabel}</b> · sin respuesta</>;
  }
}

function actionsFor(card: FeedCard) {
  if (card.approveAction === 'approve-detail') {
    return [
      { label: 'Aprobar', cls: 'btn btn-warm', href: '/pending' },
      { label: 'Ver detalle', cls: 'btn btn-ink', href: card.sourceUrl, external: true },
    ];
  }
  if (card.approveAction === 'force-detail') {
    return [
      { label: 'Forzar contacto', cls: 'btn btn-ghost', href: '#' },
      { label: 'Ver razón', cls: 'btn btn-ink', href: card.sourceUrl, external: true },
    ];
  }
  return [
    { label: 'Ver detalle', cls: 'btn btn-acc', href: card.sourceUrl, external: true },
    { label: 'Ver chat', cls: 'btn btn-ink', href: '/chats' },
  ];
}

interface FeedClientProps {
  cards: FeedCard[];
  summary: FeedSummary;
}

export default function FeedClient({ cards, summary }: FeedClientProps) {
  useEffect(() => {
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

    const cleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLElement>('.pcard').forEach((card) => {
      const enter = () => gsap.to(card, { y: -4, scale: 1.01, duration: 0.25, ease: 'power2.out' });
      const leave = () => gsap.to(card, { y: 0,  scale: 1,    duration: 0.35, ease: 'power2.out' });
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [cards.length]);

  return (
    <div className="app">
      <AppSidebar />
      <div>
        <Topbar count={summary.total} />
        <main className="feed">

          <header className="feed-head">
            <div>
              <div className="eyebrow"><span className="dot" />BÚSQUEDA ACTIVA · 2 amb · Palermo + Villa Crespo + Caballito</div>
              <h1 style={{ marginTop: 18 }}><span className="acc">{summary.total}</span> propiedades<br />filtradas <span className="it">para vos</span></h1>
              <p className="sub">De {summary.scanned} listings encontrados, Casita descartó {summary.scanned - summary.filtered} por contrafrente, expensas escondidas, fotos repetidas o requisitos imposibles. Estos quedaron.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn btn-ghost">Exportar</button>
              <button className="btn btn-acc">Refrescar ahora <span className="arrow">↻</span></button>
            </div>
          </header>

          <div className="filters">
            <div className="grp">
              <span className="f-chip on">Todas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.total}</span></span>
              <span className="f-chip">Sin contactar <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{Math.max(0, summary.total - summary.contacted - summary.discarded - summary.pending)}</span></span>
              <span className="f-chip">Esperando respuesta <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.contacted - summary.responded}</span></span>
              <span className="f-chip acc">Respondieron <span className="mono" style={{ marginLeft: 4 }}>{summary.responded}</span></span>
              <span className="f-chip">Descartadas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.discarded}</span></span>
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
                <span><b>{summary.total}</b> resultados</span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>actualizado hace <b>2 min</b></span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>3 búsquedas activas</span>
              </div>

              <div className="cards">
                {cards.map((c) => {
                  const acts = actionsFor(c);
                  return (
                    <article key={c.id} className={`pcard${c.discarded ? ' discarded' : ''}`}>
                      <div className="img-wrap">
                        <div
                          className={`ph-img${c.imgUrl ? ' ph-img-photo' : ''}`}
                          style={c.imgUrl ? { backgroundImage: `url("${c.imgUrl}")` } : undefined}
                        >
                          {!c.imgUrl && <span className="ph-label">FOTO</span>}
                        </div>
                        <div className="img-overlay">
                          <div className="top-row">
                            <span className="src">{c.src}</span>
                            <span className={`score${c.scoreClass ? ` ${c.scoreClass}` : ''}`}>{c.score}</span>
                            {c.heart && <button className="heart"><Heart size={14} strokeWidth={SW} /></button>}
                          </div>
                        </div>
                      </div>
                      <div className="body">
                        <h4>{c.title}</h4>
                        <div className="addr">{c.addr}</div>
                        <div className="price">
                          <span className="num">{c.price}</span>
                          {c.exp && <span className="exp">{c.exp}</span>}
                        </div>
                        <div className="specs">
                          {c.specs.map((s, j) => <span key={j}>{s}</span>)}
                        </div>
                        <div className={`status-row ${c.status}`}>
                          <span className="sdot" />
                          <span>{statusContent(c)}</span>
                        </div>
                        <div className="card-actions">
                          {acts.map((a, j) => (
                            <a
                              key={j}
                              href={a.href}
                              className={a.cls}
                              {...(a.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                              {a.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                <button className="btn btn-ghost">Cargar 15 más</button>
              </div>
            </div>

            <aside className="rail">
              <div className="rcard">
                <h4>Resumen de la búsqueda</h4>
                {[
                  { k: 'Listings escaneados', v: String(summary.scanned) },
                  { k: 'Pasaron filtro IA',   v: String(summary.filtered), cls: 'acc' },
                  { k: 'Contactados',          v: String(summary.contacted) },
                  { k: 'Respondieron',         v: String(summary.responded), cls: 'acc' },
                  { k: 'Pendientes tu OK',     v: String(summary.pending),   cls: 'warm' },
                  { k: 'Descartados',          v: String(summary.discarded) },
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
