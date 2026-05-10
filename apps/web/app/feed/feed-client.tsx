'use client';

import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Heart, Check, X } from 'lucide-react';

import type { FeedCard, FeedSummary } from './data';
import AppSidebar from '../../components/app-sidebar';

const SW = 1.6;

function Topbar({ count, fromAI }: { count: number; fromAI: boolean }) {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Encontrados</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        {count} {fromAI ? 'informes IA' : 'propiedades'}
      </div>
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
    case 'ai-report':
      return <><b style={{ color: 'var(--acc)' }}>Informe IA</b> · {timeLabel} · esperando tu OK</>;
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

interface FeedClientProps {
  cards: FeedCard[];
  summary: FeedSummary;
}

export default function FeedClient({ cards: initialCards, summary }: FeedClientProps) {
  const [cards, setCards] = useState<FeedCard[]>(initialCards);
  const [decidingId, setDecidingId] = useState<string | null>(null);

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

  async function handleDecide(card: FeedCard, action: 'accepted' | 'rejected') {
    if (!card.feedRowId || decidingId) return;
    setDecidingId(card.id);
    const prev = cards;
    setCards((cs) => cs.filter((c) => c.id !== card.id));
    try {
      const res = await fetch(`/api/feed/${card.feedRowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('[feed] decide failed:', err);
      setCards(prev); // rollback
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="app">
      <AppSidebar />
      <div>
        <Topbar count={cards.length} fromAI={summary.fromAI} />
        <main className="feed">

          <header className="feed-head">
            <div>
              <div className="eyebrow">
                <span className="dot" />
                {summary.fromAI
                  ? 'INFORMES IA · DECIDÍ CUÁLES SE CONTACTAN'
                  : 'BÚSQUEDA ACTIVA · 2 amb · Palermo + Villa Crespo + Caballito'}
              </div>
              <h1 style={{ marginTop: 18 }}>
                <span className="acc">{cards.length}</span> {summary.fromAI ? 'informes' : 'propiedades'}<br />
                {summary.fromAI ? <>esperando <span className="it">tu OK</span></> : <>filtradas <span className="it">para vos</span></>}
              </h1>
              <p className="sub">
                {summary.fromAI
                  ? 'Casita IA filtró estas propiedades a partir de tu charla. Aprobá las que te interesen y la IA arranca el contacto con el dueño. Las que rechaces se descartan.'
                  : `De ${summary.scanned} listings encontrados, Casita descartó ${summary.scanned - summary.filtered} por contrafrente, expensas escondidas, fotos repetidas o requisitos imposibles. Estos quedaron.`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {summary.fromAI ? (
                <a href="/chats" className="btn btn-acc">Otra búsqueda <span className="arrow">↗</span></a>
              ) : (
                <>
                  <button className="btn btn-ghost">Exportar</button>
                  <button className="btn btn-acc">Refrescar ahora <span className="arrow">↻</span></button>
                </>
              )}
            </div>
          </header>

          <div className="filters">
            <div className="grp">
              <span className="f-chip on">Todas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{cards.length}</span></span>
              {!summary.fromAI && (
                <>
                  <span className="f-chip">Sin contactar <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{Math.max(0, summary.total - summary.contacted - summary.discarded - summary.pending)}</span></span>
                  <span className="f-chip">Esperando respuesta <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.contacted - summary.responded}</span></span>
                  <span className="f-chip acc">Respondieron <span className="mono" style={{ marginLeft: 4 }}>{summary.responded}</span></span>
                  <span className="f-chip">Descartadas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.discarded}</span></span>
                </>
              )}
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
                <span><b>{cards.length}</b> resultados</span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>actualizado hace <b>2 min</b></span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>{summary.fromAI ? 'búsqueda asistida por IA' : '3 búsquedas activas'}</span>
              </div>

              <div className="cards">
                {cards.map((c) => (
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
                      {c.summary && (
                        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.45 }}>
                          {c.summary}
                        </p>
                      )}
                      {(c.pros && c.pros.length > 0) || (c.cons && c.cons.length > 0) ? (
                        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11.5 }}>
                          {c.pros && c.pros.length > 0 && (
                            <div style={{ flex: 1 }}>
                              <div style={{ color: 'var(--pos)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, marginBottom: 4 }}>A favor</div>
                              <ul style={{ margin: 0, paddingLeft: 14, color: 'var(--fg-1)', lineHeight: 1.45 }}>
                                {c.pros.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}
                              </ul>
                            </div>
                          )}
                          {c.cons && c.cons.length > 0 && (
                            <div style={{ flex: 1 }}>
                              <div style={{ color: 'var(--warm)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, marginBottom: 4 }}>A tener en cuenta</div>
                              <ul style={{ margin: 0, paddingLeft: 14, color: 'var(--fg-1)', lineHeight: 1.45 }}>
                                {c.cons.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : null}
                      <div className={`status-row ${c.status}`}>
                        <span className="sdot" />
                        <span>{statusContent(c)}</span>
                      </div>
                      <div className="card-actions">
                        {c.approveAction === 'feed-decide' ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={decidingId === c.id}
                              onClick={() => void handleDecide(c, 'rejected')}
                              style={{ color: 'var(--neg)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <X size={13} strokeWidth={SW} /> Descartar
                            </button>
                            <button
                              type="button"
                              className="btn btn-acc"
                              disabled={decidingId === c.id}
                              onClick={() => void handleDecide(c, 'accepted')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Check size={13} strokeWidth={SW} /> Aceptar y contactar
                            </button>
                            <a
                              href={c.sourceUrl}
                              className="btn btn-ink"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Ver detalle
                            </a>
                          </>
                        ) : c.approveAction === 'approve-detail' ? (
                          <>
                            <a href="/pending" className="btn btn-warm">Aprobar</a>
                            <a href={c.sourceUrl} className="btn btn-ink" target="_blank" rel="noopener noreferrer">Ver detalle</a>
                          </>
                        ) : c.approveAction === 'force-detail' ? (
                          <>
                            <a href="#" className="btn btn-ghost">Forzar contacto</a>
                            <a href={c.sourceUrl} className="btn btn-ink" target="_blank" rel="noopener noreferrer">Ver razón</a>
                          </>
                        ) : (
                          <>
                            <a href={c.sourceUrl} className="btn btn-acc" target="_blank" rel="noopener noreferrer">Ver detalle</a>
                            <a href="/chats" className="btn btn-ink">Ver chat</a>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {cards.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.5 }}>
                    No hay propiedades para mostrar. Pedile una nueva búsqueda a Casita IA.
                    <div style={{ marginTop: 16 }}>
                      <a href="/chats" className="btn btn-acc">Ir a Casita IA</a>
                    </div>
                  </div>
                )}
              </div>

              {!summary.fromAI && cards.length > 0 && (
                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                  <button className="btn btn-ghost">Cargar 15 más</button>
                </div>
              )}
            </div>

            <aside className="rail">
              <div className="rcard">
                <h4>{summary.fromAI ? 'Resumen del informe' : 'Resumen de la búsqueda'}</h4>
                {summary.fromAI ? (
                  <>
                    <div className="rstat"><span className="k">Total informes</span><span className="v acc">{summary.total}</span></div>
                    <div className="rstat"><span className="k">Esperan tu OK</span><span className="v warm">{summary.pending}</span></div>
                    <div className="rstat"><span className="k">Score promedio</span>
                      <span className="v">{cards.length > 0 ? Math.round(cards.reduce((s, c) => s + c.score, 0) / cards.length) : 0}</span>
                    </div>
                  </>
                ) : (
                  [
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
                  ))
                )}
              </div>

              {!summary.fromAI && (
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
              )}

              <div className="rcard" style={{ background: 'oklch(0.92 0.205 116 / 0.06)', borderColor: 'oklch(0.92 0.205 116 / 0.3)' }}>
                <h4 style={{ color: 'var(--acc)' }}>
                  {summary.fromAI ? '¿Cómo sigue?' : 'Casita está trabajando'}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.5 }}>
                  {summary.fromAI
                    ? 'Cuando aceptás un informe, la IA escribe al dueño por vos y, cuando cierra una cita, te avisa en Pendientes para que la confirmes.'
                    : <>3 mensajes en cola. Próximo refresco en <span className="mono">04:12</span>.</>}
                </p>
                <a href="/chats" className="btn btn-acc" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
                  {summary.fromAI ? 'Volver a Casita IA' : 'Ver conversaciones'}
                </a>
              </div>
            </aside>
          </div>

        </main>
      </div>
    </div>
  );
}
