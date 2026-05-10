'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import {
  MapPin, SlidersHorizontal, Calendar, PawPrint, ArrowRight,
} from 'lucide-react';

import AppSidebar from '../../components/app-sidebar';

gsap.registerPlugin(SplitText);

const SW = 1.6;

function Topbar() {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Buscar</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        nueva búsqueda
      </div>
      <div className="right">
        <div className="pill">
          <span className="pulse" />
          BOT ACTIVO · 3 búsquedas
        </div>
        <a href="/onboarding" className="btn btn-ghost">Setup del bot</a>
        <a href="#" className="btn btn-acc">Conectar WhatsApp <span className="arrow">↗</span></a>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initAnimations();
  }, []);

  function goSearch(query: string) {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      composerRef.current?.focus();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function initAnimations() {
    gsap.defaults({ ease: 'power3.out' });

    // ── Shell entrance ──────────────────────────────────────────────
    gsap.from('.side',   { x: -24, autoAlpha: 0, duration: 1.0 });
    gsap.from('.topbar', { y: -12, autoAlpha: 0, duration: 0.85, delay: 0.15 });

    // ── Eyebrow ──────────────────────────────────────────────────
    gsap.from('.hero-eyebrow', { autoAlpha: 0, y: 10, duration: 0.7, delay: 0.28 });

    // ── Hero title: SplitText per-char 3-D flip ───────────────────
    const heroEl = document.querySelector<HTMLElement>('.hero-h1');
    if (heroEl) {
      gsap.set(heroEl, { autoAlpha: 0 });
      gsap.set(heroEl, { autoAlpha: 1 });
      const split = new SplitText(heroEl, { type: 'chars,words', charsClass: 'split-char' });
      gsap.from(split.chars, {
        duration: 1.2,
        opacity: 0,
        scale: 0,
        y: 72,
        rotationX: 180,
        transformOrigin: '0% 50% -50',
        ease: 'back.out(1.8)',
        stagger: 0.04,
        delay: 0.4,
      });
    }

    // ── Lede ──────────────────────────────────────────────────────
    gsap.from('.hero-lede',    { autoAlpha: 0, y: 16, duration: 0.85, delay: 1.0 });

    // ── Composer slides up with slight scale ────────────────────────
    gsap.from('.composer-box', {
      autoAlpha: 0, y: 32, scale: 0.98,
      duration: 1.0, ease: 'power2.out', delay: 1.2,
    });

    // ── Preset buttons staggered pop ───────────────────────────────
    gsap.from('.preset-btn', {
      autoAlpha: 0, y: 10, scale: 0.88,
      duration: 0.6, ease: 'back.out(1.6)',
      stagger: 0.08, delay: 1.45,
    });

    // ── Live cards slide in from right ──────────────────────────────
    gsap.from('.live-card', {
      autoAlpha: 0, x: 36,
      duration: 0.75, ease: 'power2.out',
      stagger: 0.12, delay: 1.65,
    });

    // ── Stats: count-up on scroll into view ─────────────────────────
    gsap.set('.stats-section', { autoAlpha: 0, y: 20 });
    const statsEl = document.querySelector('.stats-section');
    if (statsEl) {
      const obs = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();
        gsap.to('.stats-section', { autoAlpha: 1, y: 0, duration: 0.6 });
        document.querySelectorAll<HTMLElement>('[data-count]').forEach(el => {
          const target   = parseFloat(el.dataset.count ?? '0');
          const decimals = parseInt(el.dataset.decimals ?? '0', 10);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target, duration: 1.5, ease: 'power2.out',
            onUpdate: () => {
              el.textContent = decimals > 0
                ? obj.v.toFixed(decimals)
                : Math.round(obj.v).toLocaleString('es-AR');
            },
          });
        });
      }, { threshold: 0.25 });
      obs.observe(statsEl);
    }

    // ── Pipeline steps stagger ──────────────────────────────────────
    gsap.from('.pipeline-step', {
      autoAlpha: 0, y: 28,
      duration: 0.85, stagger: 0.14, delay: 1.9,
    });

    // ── Blobs: slow float + mouse parallax ─────────────────────────
    gsap.to('.blob-1', { x: 50, y: 35, duration: 9,  repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.blob-2', { x: -35, y: -25, duration: 11, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    const b1x = gsap.quickTo('.blob-1', 'x', { duration: 1.8, ease: 'power1.out' });
    const b1y = gsap.quickTo('.blob-1', 'y', { duration: 1.8, ease: 'power1.out' });
    const b2x = gsap.quickTo('.blob-2', 'x', { duration: 2.4, ease: 'power1.out' });
    const b2y = gsap.quickTo('.blob-2', 'y', { duration: 2.4, ease: 'power1.out' });

    const mainEl = document.querySelector('main.home');
    mainEl?.addEventListener('mousemove', (ev) => {
      const e = ev as MouseEvent;
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      b1x(dx * 70); b1y(dy * 50);
      b2x(-dx * 45); b2y(-dy * 35);
    });

    // ── Send button: spring on hover ────────────────────────────────
    const sendBtn = document.querySelector<HTMLElement>('.send-btn');
    sendBtn?.addEventListener('mouseenter', () =>
      gsap.to('.send-btn', { rotation: -18, scale: 1.12, duration: 0.3, ease: 'back.out(2)' }),
    );
    sendBtn?.addEventListener('mouseleave', () =>
      gsap.to('.send-btn', { rotation: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)' }),
    );
    sendBtn?.addEventListener('click', () =>
      gsap.fromTo('.send-btn', { scale: 0.85 }, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' }),
    );
  }

  function handlePreset(text: string) {
    const phrase = `Busco un 2 ambientes — ${text.toLowerCase()}`;
    if (composerRef.current) composerRef.current.value = phrase;
    goSearch(phrase);
  }

  return (
    <div className="app">
      <AppSidebar />
      <div>
        <Topbar />
        <main className="home" style={{ position: 'relative', minHeight: 'calc(100vh - 60px)', padding: '32px 56px 80px', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 35%, black 20%, transparent 75%)',
            opacity: 0.4,
          }} />
          <div className="blob-1" style={{
            position: 'absolute', pointerEvents: 'none', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, oklch(0.92 0.205 116 / 0.15), transparent 60%)',
            filter: 'blur(40px)', zIndex: 0, top: -200, right: -180,
          }} />
          <div className="blob-2" style={{
            position: 'absolute', pointerEvents: 'none', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, oklch(0.72 0.155 45 / 0.12), transparent 60%)',
            filter: 'blur(40px)', zIndex: 0, bottom: -300, left: -200,
          }} />

          <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto' }}>

            {/* Hero */}
            <section style={{ textAlign: 'center', padding: '28px 0 24px' }}>
              <h1
                className="hero-h1"
                style={{
                  margin: 0,
                  fontSize: 'clamp(48px, 6.5vw, 100px)',
                  lineHeight: 0.92,
                  letterSpacing: '-0.045em',
                  fontWeight: 500,
                }}
              >
                <span className="hero-line" style={{ display: 'block' }}>Decime cómo</span>
                <span className="hero-line" style={{ display: 'block' }}>
                  querés <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400 }}>vivir</span>.
                </span>
                <span className="hero-line" style={{ display: 'block', color: 'var(--acc)' }}>Yo me ocupo.</span>
              </h1>
              <p className="hero-lede" style={{ maxWidth: 580, margin: '16px auto 0', color: 'var(--fg-1)', fontSize: 16, lineHeight: 1.5 }}>
                Vos describí. Casita scrapea ArgenProp, Zonaprop, Mercado Libre, escribe a los dueños por WhatsApp y te avisa cuando hay match.
              </p>
            </section>

            {/* Composer */}
            <section style={{ position: 'relative', marginTop: 28 }}>
              <div className="composer-box" style={{
                position: 'relative', background: 'var(--bg-1)', border: '1px solid var(--line)',
                borderRadius: 18, padding: '14px 16px 10px', boxShadow: 'var(--shadow-soft)',
              }}>
                <textarea
                  ref={composerRef}
                  placeholder="Quiero un 2 ambientes en Palermo o Villa Crespo, hasta $750.000 + expensas, que acepte mascotas y entre a partir del 1 de junio…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      goSearch((e.currentTarget as HTMLTextAreaElement).value);
                    }
                  }}
                  style={{
                    width: '100%', background: 'transparent', border: 0, resize: 'none',
                    color: 'var(--fg)', fontFamily: '"Space Grotesk", sans-serif',
                    fontSize: 15, lineHeight: 1.45, minHeight: 52, outline: 'none',
                  }}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 14, borderTop: '1px solid var(--line)', marginTop: 8,
                }}>
                  {([
                    [<MapPin size={13} strokeWidth={SW} />, 'Zona'],
                    [<SlidersHorizontal size={13} strokeWidth={SW} />, 'Presupuesto'],
                    [<Calendar size={13} strokeWidth={SW} />, 'Fecha de mudanza'],
                    [<PawPrint size={13} strokeWidth={SW} />, 'Mascotas'],
                  ] as const).map(([ico, label]) => (
                    <button key={label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line)',
                      fontSize: 12, color: 'var(--fg-1)', background: 'var(--bg-2)', cursor: 'pointer',
                    }}>
                      <span style={{ color: 'var(--fg-2)', display: 'flex' }}>{ico}</span>
                      {label}
                    </button>
                  ))}
                  <button
                    className="send-btn"
                    aria-label="Enviar a Casita"
                    onClick={() => goSearch(composerRef.current?.value ?? '')}
                    style={{
                      marginLeft: 'auto', width: 44, height: 44, borderRadius: '50%',
                      background: 'var(--acc)', color: 'var(--acc-ink)',
                      display: 'grid', placeItems: 'center', border: 0, cursor: 'pointer',
                      willChange: 'transform',
                    }}
                  >
                    <ArrowRight size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
                {[
                  ['01', 'Mudanza relámpago: 7 días'],
                  ['02', 'Hasta $600k todo incluido'],
                  ['03', 'Cerca de subte línea B'],
                  ['04', 'Sin garante propietario'],
                ].map(([num, text]) => (
                  <button
                    key={num}
                    className="preset-btn"
                    onClick={() => handlePreset(text)}
                    style={{
                      padding: '10px 14px', borderRadius: 999, border: '1px solid var(--line)',
                      background: 'var(--bg-1)', color: 'var(--fg-1)', fontSize: 13, cursor: 'pointer',
                      willChange: 'transform',
                    }}
                  >
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--fg-3)', marginRight: 6 }}>{num}</span>
                    {text}
                  </button>
                ))}
              </div>
            </section>

            {/* Live activity */}
            <section style={{ marginTop: 90, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { accent: 'acc', top: 'WhatsApp · saliente', when: 'hace 2 min', who: 'Soledad — Caballito', what: <>Casita le escribió: "Hola Soledad, vi tu publicación del 2 amb. ¿Sigue disponible para junio?" <b>esperando respuesta</b></> },
                { accent: 'pos', top: 'RESPONDIÓ · MATCH 92%', when: 'hace 11 min', who: 'Federico — Villa Crespo', what: <>Confirmó disponibilidad y propuso visita el <b>jueves 16hs</b>. Esperando tu OK.</> },
                { accent: 'warm', top: 'DESCARTADO POR LA IA', when: 'hace 22 min', who: 'Avenida Rivadavia 5400', what: 'Razón: contrafrente, sin luz natural y supera +18% del presupuesto.' },
              ].map((item, i) => (
                <div key={i} className="live-card" style={{
                  background: 'var(--bg-1)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r-3)', padding: '18px 20px',
                  position: 'relative', overflow: 'hidden', willChange: 'transform',
                }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `var(--${item.accent})` }} />
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                    color: 'var(--fg-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
                  }}>
                    <span>{item.top}</span>
                    <span style={{ marginLeft: 'auto' }}>{item.when}</span>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--fg)', marginBottom: 4, fontWeight: 500 }}>{item.who}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.4 }}>{item.what}</div>
                </div>
              ))}
            </section>

            {/* Stats strip */}
            <section className="stats-section" style={{
              marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
            }}>
              {[
                { target: 142, color: 'var(--fg)', lab: 'contactados esta semana' },
                { target: 38, suffix: '%', color: 'var(--acc)', lab: 'tasa de respuesta' },
                { target: 6, color: 'var(--fg)', lab: 'visitas agendadas' },
                { target: 2.4, decimals: 1, suffix: 'h', color: 'var(--warm)', lab: 'tiempo medio de match' },
              ].map((stat, i) => (
                <div key={i} style={{ padding: '24px 20px', borderRight: i < 3 ? '1px solid var(--line)' : '0' }}>
                  <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: 56, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: stat.color }}>
                    <span
                      data-count={stat.target}
                      data-decimals={stat.decimals ?? 0}
                    >
                      {stat.decimals ? stat.target.toFixed(stat.decimals) : stat.target}
                    </span>
                    {stat.suffix && <span style={{ fontSize: 28, color: 'var(--fg-2)', marginLeft: 4 }}>{stat.suffix}</span>}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                    {stat.lab}
                  </div>
                </div>
              ))}
            </section>

            {/* Pipeline */}
            <section style={{ marginTop: 80 }}>
              <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', marginBottom: 28 }}>
                <h2 style={{ margin: 0, fontSize: 44, letterSpacing: '-0.03em', lineHeight: 1, fontWeight: 500 }}>
                  Cómo funciona <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', fontWeight: 400, color: 'var(--fg-2)' }}>por debajo.</span>
                </h2>
                <span className="eyebrow"><span className="dot" />4 ETAPAS</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--line)', borderRadius: 'var(--r-3)', overflow: 'hidden' }}>
                {[
                  { num: '01 / SCRAPE', title: 'Tira la red', desc: 'Cada 6 minutos refresca ArgenProp, Zonaprop, Mercado Libre y unifica todo en un solo formato.', tags: [{ label: 'argenprop' }, { label: 'zonaprop' }, { label: 'mlibre' }] },
                  { num: '02 / FILTRO IA', title: 'Lee entre líneas', desc: 'Detecta contrafrente, "ideal estudiante", garante propietario, expensas escondidas, fotos truchas.', tags: [{ label: 'match score', color: 'var(--acc)' }, { label: 'flags' }] },
                  { num: '03 / OUTREACH', title: 'Escribe por vos', desc: 'Llama, manda mail o WhatsApp con el tono que pediste — formal, canchero o directo.', tags: [{ label: 'whatsapp' }, { label: 'mail' }, { label: 'tel', color: 'var(--warm)' }] },
                  { num: '04 / HANDOFF', title: 'Te pasa el OK', desc: 'Cuando hay día y hora, te pide aprobación y te manda el link al detalle centralizado.', tags: [{ label: 'aprobás', color: 'var(--pos)' }, { label: 'link unificado' }] },
                ].map((step, i) => (
                  <div key={i} className="pipeline-step" style={{
                    padding: '24px 22px', borderRight: i < 3 ? '1px solid var(--line)' : '0',
                    position: 'relative', minHeight: 200, willChange: 'transform',
                  }}>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.12em' }}>{step.num}</div>
                    <h4 style={{ margin: '14px 0 8px', fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>{step.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{step.desc}</p>
                    <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {step.tags.map((tag, j) => (
                        <span key={j} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          padding: '4px 8px', borderRadius: 999,
                          border: `1px solid ${tag.color ? `${tag.color}66` : 'var(--line)'}`,
                          color: tag.color ?? 'var(--fg-2)',
                        }}>{tag.label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
