'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Check, X, ExternalLink } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '../../lib/use-isomorphic-layout-effect';

import AppSidebar from '../../components/app-sidebar';

const SW = 1.6;

// Photo gradient per card for visual variety
const photoGradients = [
  'linear-gradient(135deg, oklch(0.18 0.04 200) 0%, oklch(0.14 0.02 240) 100%)',
  'linear-gradient(135deg, oklch(0.17 0.03 280) 0%, oklch(0.14 0.02 300) 100%)',
  'linear-gradient(135deg, oklch(0.18 0.04 45)  0%, oklch(0.14 0.02 30)  100%)',
  'linear-gradient(135deg, oklch(0.17 0.04 130) 0%, oklch(0.14 0.02 160) 100%)',
  'linear-gradient(135deg, oklch(0.16 0.04 320) 0%, oklch(0.13 0.02 340) 100%)',
];

interface Request {
  id: number;
  msg: string;
  property: string;
  address: string;
  price: string;
  score: number;
  scoreClass?: 'warn';
  photo: string;
  source: string;
  link: string;
  time?: string;
}

const INITIAL: Request[] = [
  {
    id: 1,
    msg: '¿Disponible para visita el jueves 16 de mayo a las 18:00hs?',
    property: '2 amb. luminoso · contrafrente al patio',
    address: 'AGUIRRE 800 · VILLA CRESPO',
    price: '$ 720k',
    score: 94,
    photo: 'LIVING',
    source: 'ARGENPROP',
    link: '/property',
    time: 'Jue 16 may · 18:00',
  },
  {
    id: 2,
    msg: '¿Confirmo visita el sábado 18 de mayo a las 11:00hs?',
    property: 'Monoamb. amplio convertido en 2 amb.',
    address: 'ACUÑA DE FIGUEROA 600 · ALMAGRO',
    price: '$ 540k',
    score: 87,
    photo: 'BALCÓN',
    source: 'ZONAPROP',
    link: '/property',
    time: 'Sáb 18 may · 11:00',
  },
  {
    id: 3,
    msg: 'Mariana bajó el precio. ¿Hago contrapropuesta de $680k?',
    property: '2 amb. con cochera y baulera',
    address: 'AV. CÓRDOBA 4800 · ALMAGRO',
    price: '$ 670k',
    score: 85,
    photo: 'COCINA',
    source: 'ZONAPROP',
    link: '/property',
  },
  {
    id: 4,
    msg: 'PH disponible desde junio. ¿Le escribo para coordinar visita?',
    property: 'PH reciclado · planta alta con terraza',
    address: 'HONDURAS 4200 · PALERMO SOHO',
    price: '$ 745k',
    score: 71,
    scoreClass: 'warn',
    photo: 'FACHADA',
    source: 'ARGENPROP',
    link: '/property',
  },
  {
    id: 5,
    msg: '¿Reagendamos la visita para el lunes 20 de mayo a las 16hs?',
    property: '2 amb. al frente, edificio reciclado',
    address: 'HIDALGO 600 · CABALLITO NORTE',
    price: '$ 615k',
    score: 82,
    photo: 'DORMITORIO',
    source: 'M. LIBRE',
    link: '/property',
    time: 'Lun 20 may · 16:00',
  },
];

export default function ApprovePage() {
  const [deck, setDeck] = useState(INITIAL);
  const [answered, setAnswered] = useState<{ id: number; yes: boolean }[]>([]);
  const [busy, setBusy] = useState(false);
  const firstRender = useRef(true);
  const [mounted, setMounted] = useState(false);
  const animatedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted || animatedRef.current) return;
    animatedRef.current = true;
    initEntrance();
  }, [mounted]);

  function initEntrance() {
    gsap.defaults({ ease: 'power3.out' });
    // Transform-only entrance (never goes through opacity:0).
    gsap.from('.side',         { x: -28, duration: 0.7 });
    gsap.from('.topbar',       { y: -16, duration: 0.6, delay: 0.08 });
    gsap.from('.approve-dots', { y: 16,  duration: 0.55, delay: 0.18 });
    gsap.from('.deck-wrap',    { y: 44, scale: 0.94, duration: 0.85, ease: 'back.out(1.4)', delay: 0.26 });
    gsap.from('.approve-actions', { y: 22, duration: 0.6, delay: 0.55 });
    gsap.from('.kbd-hint',     { y: 12,  duration: 0.5, delay: 0.7 });

    // Subtle hint tilt: card breathes slightly.
    gsap.to('.req-card', {
      rotation: 1.5, duration: 2.4,
      ease: 'sine.inOut', repeat: 1, yoyo: true, delay: 1.6,
    });
  }

  // Card entrance after deck state updates (skip initial mount)
  useLayoutEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (deck.length === 0) return;
    gsap.fromTo(
      '.req-card',
      { autoAlpha: 0, scale: 0.85, y: 32 },
      { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: 'back.out(1.6)' },
    );
  }, [deck.length]);

  const answer = useCallback((yes: boolean) => {
    if (busy || deck.length === 0) return;
    setBusy(true);
    const card = document.querySelector<HTMLElement>('.req-card');
    if (!card) { setBusy(false); return; }

    gsap.to(card, {
      x: yes ? 540 : -540,
      y: -60,
      rotation: yes ? 24 : -24,
      autoAlpha: 0,
      duration: 0.52,
      ease: 'power2.in',
      onComplete: () => {
        setAnswered(a => [...a, { id: deck[0].id, yes }]);
        setDeck(prev => prev.slice(1));
        setBusy(false);
      },
    });
  }, [busy, deck]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') answer(true);
      if (e.key === 'ArrowLeft')  answer(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answer]);

  const remaining = deck.length;
  const current   = deck[0];
  const gradIdx   = (INITIAL.length - remaining) % photoGradients.length;

  if (!mounted) return <div className="app" />;

  return (
    <div className="app">
      <AppSidebar />
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        <div className="topbar">
          <div className="crumb">
            <b>Aprobar</b>
            <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
            solicitudes del agente
          </div>
          <div className="right">
            <div className="pill">
              <span className="pulse" />
              BOT ACTIVO · {remaining} pendiente{remaining !== 1 ? 's' : ''}
            </div>
            <a href="/pending" className="btn btn-ghost">Ver detalle</a>
          </div>
        </div>

        <main className="approve">
          {remaining > 0 ? (
            <>
              {/* Progress dots */}
              <div className="approve-dots">
                {INITIAL.map((req) => {
                  const ans = answered.find(a => a.id === req.id);
                  const isCurrent = current?.id === req.id;
                  return (
                    <span
                      key={req.id}
                      className={`adot${isCurrent ? ' current' : ''}${ans ? (ans.yes ? ' yes' : ' no') : ''}`}
                    />
                  );
                })}
              </div>

              {/* Card deck */}
              <div className="deck-wrap">
                {remaining >= 3 && <div className="depth-card dc-2" />}
                {remaining >= 2 && <div className="depth-card dc-1" />}

                <div className="req-card" key={current.id}>
                  {/* Photo area */}
                  <div
                    className="card-photo"
                    style={{ background: photoGradients[gradIdx] }}
                  >
                    <span className="card-src">{current.source}</span>
                    <span className="card-photo-label">FOTO · {current.photo}</span>
                    <span className={`card-score${current.scoreClass ? ` ${current.scoreClass}` : ''}`}>
                      {current.score}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="card-body">
                    <div className="card-agent">casita · agente</div>
                    <div className="card-q">{current.msg}</div>
                    <div className="card-prop-name">{current.property}</div>
                    <div className="card-addr">{current.address}</div>
                    <div className="card-row">
                      <span className="card-price">{current.price}</span>
                      {current.time && <span className="card-time">{current.time}</span>}
                    </div>
                    <a href={current.link} className="card-link">
                      <ExternalLink size={11} strokeWidth={SW} />
                      Ver detalle completo
                    </a>
                  </div>
                </div>
              </div>

              {/* Yes / No */}
              <div className="approve-actions">
                <button className="act-btn act-no" onClick={() => answer(false)} aria-label="No">
                  <X size={20} strokeWidth={2.5} />
                  No
                </button>
                <button className="act-btn act-yes" onClick={() => answer(true)} aria-label="Sí">
                  <Check size={20} strokeWidth={2.5} />
                  Sí
                </button>
              </div>

              <p className="kbd-hint">
                <kbd>←</kbd> no &nbsp; sí <kbd>→</kbd>
              </p>
            </>
          ) : (
            /* Done state */
            <div className="done-state">
              <div className="done-icon">✓</div>
              <h2>¡Todo respondido!</h2>
              <p>
                Aprobaste{' '}
                <b style={{ color: 'var(--acc)' }}>{answered.filter(a => a.yes).length}</b>
                , rechazaste{' '}
                <b style={{ color: 'var(--neg)' }}>{answered.filter(a => !a.yes).length}</b>
              </p>
              <div className="done-actions">
                <a href="/feed"  className="btn btn-acc">Ver propiedades →</a>
                <a href="/chats" className="btn btn-ghost">Ver chats</a>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
