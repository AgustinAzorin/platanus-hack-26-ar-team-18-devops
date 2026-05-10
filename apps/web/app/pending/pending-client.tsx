'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../../lib/use-isomorphic-layout-effect';
import { flushSync } from 'react-dom';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ExternalLink, Check, X } from 'lucide-react';

import type { CardData } from './data';
import AppSidebar from '../../components/app-sidebar';

gsap.registerPlugin(Flip);

const SW = 1.6;

function Topbar({ count }: { count: number }) {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Pendientes</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        {count > 0 ? `${count} esperando OK` : 'Todo al día'}
      </div>
      <div className="right">
        <div className="pill">
          <span className="pulse" />
          BOT ACTIVO · 3 búsquedas
        </div>
        <a href="/chats" className="btn btn-ghost">Ver chats</a>
      </div>
    </div>
  );
}

const CARD_W   = 280;
const CARD_H   = 400;
const CARD_OFF = 18;
const MAX_VIS  = 5;

interface PendingClientProps {
  initialCards: CardData[];
}

export default function PendingClient({ initialCards }: PendingClientProps) {
  const [cards, setCards] = useState<CardData[]>(initialCards);
  const [busy,  setBusy ] = useState(false);
  const dragRef = useRef({ startX: 0, active: false });
  const noBtnRef = useRef<HTMLButtonElement>(null);
  const siBtnRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const animatedRef = useRef(false);

  function setBtnIntensity(btn: HTMLButtonElement | null, intensity: number) {
    if (!btn) return;
    const t = Math.max(0, Math.min(1, intensity));
    gsap.to(btn, {
      scale: 1 + 0.18 * t,
      duration: t > 0.4 ? 0.18 : 0.34,
      ease: t > 0.4 ? 'back.out(2)' : 'power2.out',
      overwrite: 'auto',
    });
    if (t > 0.35) btn.classList.add('is-hot');
    else btn.classList.remove('is-hot');
  }

  function bounceBtn(btn: HTMLButtonElement | null) {
    if (!btn) return;
    gsap.timeline({ overwrite: 'auto' })
      .to(btn, { scale: 0.88, duration: 0.08, ease: 'power2.in' })
      .to(btn, { scale: 1.22, duration: 0.18, ease: 'back.out(2.4)' })
      .to(btn, { scale: 1,    duration: 0.22, ease: 'power2.out' });
  }

  useEffect(() => { setMounted(true); }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted || animatedRef.current) return;
    animatedRef.current = true;
    gsap.defaults({ ease: 'power3.out' });
    gsap.from('.side',       { x: -28, duration: 0.7 });
    gsap.from('.topbar',     { y: -16, duration: 0.6, delay: 0.08 });
    gsap.from('.sw-scene',   { y: 36, scale: 0.96, duration: 0.7, ease: 'back.out(1.3)', delay: 0.2 });
    gsap.from('.sw-actions', { y: 22, duration: 0.6, delay: 0.4 });
  }, [mounted]);

  function onDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (busy || cards.length === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, active: true };
  }

  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    gsap.set(e.currentTarget, { x: dx, rotation: dx * 0.07, transformOrigin: 'bottom center' });
    const t = Math.min(1, Math.abs(dx) / 100);
    setBtnIntensity(siBtnRef.current, dx > 0 ? t : 0);
    setBtnIntensity(noBtnRef.current, dx < 0 ? t : 0);
  }

  function onDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 80) {
      gsap.set(e.currentTarget, { x: 0, rotation: 0 });
      bounceBtn(dx > 0 ? siBtnRef.current : noBtnRef.current);
      setBtnIntensity(dx > 0 ? noBtnRef.current : siBtnRef.current, 0);
      handleAction(dx > 0 ? 'si' : 'no');
    } else {
      gsap.to(e.currentTarget, { x: 0, rotation: 0, duration: 0.45, ease: 'back.out(1.7)' });
      setBtnIntensity(siBtnRef.current, 0);
      setBtnIntensity(noBtnRef.current, 0);
    }
  }

  function handleAction(action: 'si' | 'no') {
    if (busy || cards.length === 0) return;
    setBusy(true);

    const state = Flip.getState('.sw-card');

    flushSync(() => {
      setCards(prev => prev.slice(1));
    });

    Flip.from(state, {
      targets: '.sw-card',
      ease: 'sine.inOut',
      absolute: true,
      duration: 0.5,
      onLeave: (elements) =>
        gsap.to(elements, {
          duration: 0.3,
          yPercent: 5,
          xPercent: action === 'si' ? 5 : -5,
          transformOrigin: action === 'si' ? 'bottom right' : 'bottom left',
          opacity: 0,
          ease: 'expo.out',
        }),
      onEnter: (elements) =>
        gsap.from(elements, {
          duration: 0.3,
          yPercent: 20,
          opacity: 0,
          ease: 'expo.out',
        }),
      onComplete: () => setBusy(false),
    });
  }

  const visible  = cards.slice(0, MAX_VIS);
  const reversed = [...visible].reverse();
  const front    = cards[0];
  const totalOff = (visible.length - 1) * CARD_OFF;

  if (!mounted) return <div className="app" />;

  return (
    <div className="app">
      <AppSidebar />

      <div>
        <Topbar count={cards.length} />

        <main className="pend">

          <div className="sw-scene">

            {cards.length === 0 ? (
              <div className="sw-empty">
                <div className="sw-empty-check">✓</div>
                <p>Casita sigue buscando en segundo plano.</p>
              </div>
            ) : (
              <>
                <div className="sw-main">
                {/* Card stack */}
                <div
                  className="sw-stack"
                  style={{ width: CARD_W + totalOff, height: CARD_H }}
                >
                  {reversed.map((card, domIndex) => {
                    const off    = domIndex * CARD_OFF;
                    const isFront = card.id === front?.id;
                    return (
                      <div
                        key={card.id}
                        className={[
                          'sw-card',
                          isFront ? 'sw-front' : '',
                          card.urgent ? 'sw-urgent' : '',
                        ].join(' ')}
                        style={{
                          width:    CARD_W,
                          height:   CARD_H,
                          left:     off,
                          top:      -off,
                          zIndex:   domIndex + 1,
                          position: 'absolute',
                          cursor:   isFront ? 'grab' : undefined,
                          userSelect: 'none',
                        }}
                        {...(isFront ? {
                          onPointerDown: onDragStart,
                          onPointerMove: onDragMove,
                          onPointerUp:   onDragEnd,
                          onPointerCancel: onDragEnd,
                        } : {})}
                      >
                        {/* Full-portrait image with gradient overlay */}
                        <div
                          className={`sw-img${card.imgUrl ? ' sw-img-photo' : ''}`}
                          style={card.imgUrl ? { backgroundImage: `url("${card.imgUrl}")` } : undefined}
                        >
                          <span className="sw-source">{card.source}</span>
                          <span className={`sw-score${card.scoreWarm ? ' sw-score-warm' : ''}`}>
                            {card.score}
                          </span>
                          {isFront && (
                            <div className="sw-overlay">
                              <div className="sw-type">{card.type}</div>
                              <h3 className="sw-title">{card.title}</h3>
                              <div className="sw-addr">
                                {card.address}
                                <span className="sw-addr-sub"> · {card.neighborhood}</span>
                              </div>
                              <div className="sw-details">{card.details}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                  {/* Actions */}
                  <div className="sw-actions">
                    <button
                      ref={noBtnRef}
                      className="sw-btn sw-no"
                      onClick={() => { bounceBtn(noBtnRef.current); handleAction('no'); }}
                      onPointerEnter={() => setBtnIntensity(noBtnRef.current, 1)}
                      onPointerLeave={() => setBtnIntensity(noBtnRef.current, 0)}
                      disabled={busy}
                      aria-label="No aprobar"
                    >
                      <X size={26} strokeWidth={2.2} />
                    </button>

                    {front && (
                      <a
                        href={front.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sw-link"
                      >
                        <ExternalLink size={13} strokeWidth={SW} />
                        Ver propiedad
                      </a>
                    )}

                    <button
                      ref={siBtnRef}
                      className="sw-btn sw-si"
                      onClick={() => { bounceBtn(siBtnRef.current); handleAction('si'); }}
                      onPointerEnter={() => setBtnIntensity(siBtnRef.current, 1)}
                      onPointerLeave={() => setBtnIntensity(siBtnRef.current, 0)}
                      disabled={busy}
                      aria-label="Aprobar"
                    >
                      <Check size={26} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>

                {/* Summary on the right */}
                {front && (
                  <aside className="sw-desc-panel">
                    <div className="sw-desc-label">
                      <span className="sw-ai-dot" />
                      Resumen IA
                    </div>
                    <p className="sw-summary">{front.summary ?? front.description}</p>
                  </aside>
                )}
              </>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
