'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../lib/use-isomorphic-layout-effect';
import { gsap } from 'gsap';
import { Heart, FileText } from 'lucide-react';

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
      return <><b style={{ color: 'var(--acc)' }}>Informe IA</b> · {timeLabel}</>;
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

type SortMode = 'match' | 'price' | 'recent';
type SortDir  = 'asc' | 'desc';

// Default direction per mode: match high→low, price low→high, recent new→old.
const DEFAULT_DIR: Record<SortMode, SortDir> = {
  match:  'desc',
  price:  'asc',
  recent: 'desc',
};

export default function FeedClient({ cards: initialCards, summary }: FeedClientProps) {
  const [cards] = useState<FeedCard[]>(initialCards);
  const [threshold, setThreshold] = useState(70);
  const [sort, setSort] = useState<{ mode: SortMode; dir: SortDir }>({ mode: 'match', dir: 'desc' });
  const [mounted, setMounted] = useState(false);
  const animatedRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('feedScoreThreshold');
    if (saved !== null) setThreshold(Number(saved));
  }, []);

  function handleThresholdChange(v: number) {
    setThreshold(v);
    localStorage.setItem('feedScoreThreshold', String(v));
  }

  function handleSortClick(mode: SortMode) {
    setSort((prev) =>
      prev.mode === mode
        ? { mode, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { mode, dir: DEFAULT_DIR[mode] },
    );
  }

  const aiFeedCards = cards.filter((c) => c.approveAction === 'feed-decide');
  const aboveCards = aiFeedCards.filter((c) => c.score >= threshold);
  const belowCards = aiFeedCards.filter((c) => c.score < threshold);
  const otherCards = cards.filter((c) => c.approveAction !== 'feed-decide');

  // Sort each bucket independently. The threshold split (above/below) is
  // preserved across all sort modes — match/price/recent only changes the
  // order within each bucket.
  const sortFn = (a: FeedCard, b: FeedCard): number => {
    let cmp: number;
    if (sort.mode === 'price') {
      const pa = a.priceValue ?? Number.POSITIVE_INFINITY;
      const pb = b.priceValue ?? Number.POSITIVE_INFINITY;
      cmp = pa - pb;
    } else if (sort.mode === 'recent') {
      cmp = a.createdAtMs - b.createdAtMs;
    } else {
      cmp = a.score - b.score; // match
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  };
  // Below-threshold cards are hidden entirely (not rendered) to keep the DOM
  // small and make threshold changes feel instant. The bucket is still
  // computed so the header can show how many were dropped.
  const orderedCards = [
    ...[...otherCards].sort(sortFn),
    ...[...aboveCards].sort(sortFn),
  ];

  const arrow = (mode: SortMode) =>
    sort.mode === mode ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '';

  useEffect(() => { setMounted(true); }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    if (!animatedRef.current) {
      animatedRef.current = true;
      gsap.defaults({ ease: 'power3.out' });
      gsap.from('.side',      { x: -28, duration: 0.7 });
      gsap.from('.topbar',    { y: -16, duration: 0.6, delay: 0.08 });
      gsap.from('.feed-head', { y: 26,  duration: 0.7,  delay: 0.16 });
      gsap.from('.filters',   { y: 18,  duration: 0.55, delay: 0.26 });
      gsap.from('.meta-row',  { y: 14,  duration: 0.5,  delay: 0.34 });
      gsap.from('.pcard',     { y: 32, scale: 0.96, duration: 0.6, ease: 'power2.out', stagger: { amount: 0.6, from: 'start' }, delay: 0.42 });
      gsap.from('.rcard',     { x: 28, duration: 0.6, ease: 'power2.out', stagger: 0.08, delay: 0.5 });
    }

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
  }, [mounted, cards.length]);

  if (!mounted) return <div className="app" />;

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
                  ? 'INFORMES IA · REVISÁ LOS QUE SUPERAN TU UMBRAL'
                  : 'BÚSQUEDA ACTIVA · 2 amb · Palermo + Villa Crespo + Caballito'}
              </div>
              <h1 style={{ marginTop: 18 }}>
                <span className="acc">{aboveCards.length || cards.length}</span> {summary.fromAI ? 'informes' : 'propiedades'}<br />
                {summary.fromAI ? <>listos para <span className="it">revisar</span></> : <>filtradas <span className="it">para vos</span></>}
              </h1>
              <p className="sub">
                {summary.fromAI
                  ? `Casita IA generó ${cards.length} informes. ${aboveCards.length} superan el umbral de score ${threshold}.${belowCards.length > 0 ? ` ${belowCards.length} quedaron ocultos por debajo del umbral — bajalo para verlos.` : ''}`
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
            {!summary.fromAI && (
              <div className="grp">
                <span className="f-chip">Sin contactar <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{Math.max(0, summary.total - summary.contacted - summary.discarded - summary.pending)}</span></span>
                <span className="f-chip">Esperando respuesta <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.contacted - summary.responded}</span></span>
                <span className="f-chip acc">Respondieron <span className="mono" style={{ marginLeft: 4 }}>{summary.responded}</span></span>
                <span className="f-chip">Descartadas <span className="mono" style={{ color: 'var(--fg-3)', marginLeft: 4 }}>{summary.discarded}</span></span>
              </div>
            )}
            <div className="right" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {summary.fromAI && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-2)', whiteSpace: 'nowrap' }}>Umbral score:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={threshold}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                    style={{ width: 90, accentColor: 'var(--acc)', cursor: 'pointer' }}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 12, minWidth: 26, textAlign: 'right',
                      color: threshold >= 70 ? 'var(--acc)' : threshold >= 50 ? 'var(--warm)' : 'var(--neg)',
                      fontWeight: 600,
                    }}
                  >
                    {threshold}
                  </span>
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Ordenar:</span>
              <div className="seg">
                <button className={sort.mode === 'match'  ? 'on' : ''} onClick={() => handleSortClick('match')}>Match{arrow('match')}</button>
                <button className={sort.mode === 'price'  ? 'on' : ''} onClick={() => handleSortClick('price')}>Precio{arrow('price')}</button>
                <button className={sort.mode === 'recent' ? 'on' : ''} onClick={() => handleSortClick('recent')}>Recientes{arrow('recent')}</button>
              </div>
            </div>
          </div>

          <div className="feed-layout">
            <div>
              <div className="meta-row">
                <span><b>{orderedCards.length}</b> resultados</span>
                {summary.fromAI && belowCards.length > 0 && (
                  <>
                    <span style={{ color: 'var(--line-2)' }}>·</span>
                    <span style={{ color: 'var(--fg-3)' }}>{belowCards.length} ocultos por umbral</span>
                  </>
                )}
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>actualizado hace <b>2 min</b></span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span>{summary.fromAI ? 'búsqueda asistida por IA' : '3 búsquedas activas'}</span>
              </div>

              <div className="cards">
                {orderedCards.map((c) => {
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
                        {c.summary && (
                          <p
                            style={{
                              margin: '6px 0 0',
                              fontSize: 12.5,
                              color: 'var(--fg-2)',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                              overflow: 'hidden',
                            }}
                          >
                            {c.summary}
                          </p>
                        )}

                        <div className={`status-row ${c.status}`}>
                          <span className="sdot" />
                          <span>{statusContent(c)}</span>
                        </div>

                        <div className="card-actions">
                          {c.approveAction === 'feed-decide' ? (
                            <a
                              href={`/informe/${c.feedRowId}`}
                              className="btn btn-acc"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <FileText size={13} strokeWidth={SW} /> Ver informe
                            </a>
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
                  );
                })}
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
                    <div className="rstat"><span className="k">Total informes</span><span className="v">{summary.total}</span></div>
                    <div className="rstat"><span className="k">Sobre umbral ({threshold}+)</span><span className="v acc">{aboveCards.length}</span></div>
                    <div className="rstat"><span className="k">Descartados</span><span className="v" style={{ color: 'var(--neg)' }}>{belowCards.length}</span></div>
                    <div className="rstat">
                      <span className="k">Score promedio</span>
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
                    ? 'Los informes que superan tu umbral de score están disponibles para revisar. Ajustá el umbral en los filtros para ver más o menos resultados.'
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
