'use client';

import { ArrowLeft, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

import AppSidebar from '../../../components/app-sidebar';

const SW = 1.6;

interface PropertyInfo {
  posting_id: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  price_value: number | null;
  price_type: string | null;
  expenses_value: number | null;
  square_meters_area: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  image_urls: string[];
  description_summary: string | null;
  zonapropUrl: string | null;
}

interface InformeClientProps {
  feedRowId: string;
  score: number;
  summary: string | null;
  pros: string[];
  cons: string[];
  createdAt: string;
  property: PropertyInfo;
}

function formatPrice(value: number | null, type: string | null): string {
  if (!value) return '—';
  const symbol = type === 'USD' ? 'USD ' : '$ ';
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1000) return `${symbol}${Math.round(value / 1000)}k`;
  return `${symbol}${new Intl.NumberFormat('es-AR').format(Math.round(value))}`;
}

function buildTitle(p: PropertyInfo): string {
  const rooms = p.rooms ?? 1;
  const ambWord = rooms === 1 ? 'Monoambiente' : `${rooms} ambientes`;
  return `${ambWord} en ${p.neighborhood ?? p.city ?? 'CABA'}`;
}

function minutesAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h}h`;
  return 'ayer';
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--acc)' :
    score >= 50 ? 'var(--warm)' :
    'var(--neg)';
  const inkColor =
    score >= 70 ? 'var(--acc-ink)' : 'var(--fg)';

  return (
    <div
      style={{
        width: 72, height: 72, borderRadius: '50%',
        background: color, color: inkColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, flexShrink: 0,
        boxShadow: `0 0 0 8px color-mix(in oklch, ${color} 15%, transparent)`,
      }}
    >
      {score}
    </div>
  );
}

export default function InformeClient({
  feedRowId,
  score,
  summary,
  pros,
  cons,
  createdAt,
  property: p,
}: InformeClientProps) {
  const cover = p.image_urls[0] ?? null;
  const title = buildTitle(p);
  const price = formatPrice(p.price_value, p.price_type);
  const exp = p.expenses_value ? `+ ${formatPrice(p.expenses_value, null)} expensas` : null;
  const timeLabel = minutesAgo(createdAt);

  const scoreLabel =
    score >= 70 ? 'Excelente match' :
    score >= 50 ? 'Match moderado' :
    'Match bajo';

  return (
    <div className="app">
      <AppSidebar />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div className="topbar">
          <div className="crumb">
            <a href="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)' }}>
              <ArrowLeft size={14} strokeWidth={SW} /> Volver al feed
            </a>
            <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
            <b>Informe IA</b>
          </div>
          <div className="right">
            <div className="pill"><span className="pulse" />BOT ACTIVO · 3 búsquedas</div>
            {p.zonapropUrl && (
              <a
                href={p.zonapropUrl}
                className="btn btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Ver en Zonaprop <ExternalLink size={12} strokeWidth={SW} />
              </a>
            )}
          </div>
        </div>

        <main style={{ padding: '40px 56px 80px', maxWidth: 900, width: '100%' }}>

          {/* Eyebrow */}
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            <span className="dot" />
            INFORME IA · GENERADO {timeLabel.toUpperCase()}
          </div>

          {/* Property card */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)', overflow: 'hidden', marginBottom: 32,
          }}>
            {cover && (
              <div
                style={{
                  height: 280, backgroundImage: `url("${cover}")`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              />
            )}
            <div style={{ padding: '24px 28px' }}>
              <h1 style={{
                margin: '0 0 6px', fontSize: 28, fontWeight: 600,
                letterSpacing: '-0.03em', lineHeight: 1.1,
              }}>
                {title}
              </h1>
              <p style={{ margin: '0 0 20px', color: 'var(--fg-2)', fontSize: 14 }}>
                {p.address ?? '—'} · {p.neighborhood ?? p.city ?? 'CABA'}
              </p>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{price}</span>
                  {exp && <span style={{ marginLeft: 8, color: 'var(--fg-2)', fontSize: 13 }}>{exp}</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {p.square_meters_area && (
                    <span className="tag" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {Math.round(p.square_meters_area)} m²
                    </span>
                  )}
                  {p.rooms && (
                    <span className="tag" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.rooms} amb.
                    </span>
                  )}
                  {p.bedrooms && (
                    <span className="tag" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.bedrooms} dorm.
                    </span>
                  )}
                  {p.bathrooms && (
                    <span className="tag" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.bathrooms} baño{p.bathrooms > 1 ? 's' : ''}
                    </span>
                  )}
                  {p.parking ? (
                    <span className="tag" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      cochera
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Score + summary */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)', padding: '28px', marginBottom: 24,
            display: 'flex', gap: 24, alignItems: 'flex-start',
          }}>
            <ScoreBadge score={score} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                  Score {score}
                </h2>
                <span style={{
                  fontSize: 12, padding: '3px 10px', borderRadius: 999,
                  background: score >= 70 ? 'oklch(0.92 0.205 116 / 0.12)' : score >= 50 ? 'oklch(0.72 0.155 45 / 0.12)' : 'oklch(0.68 0.20 25 / 0.12)',
                  color: score >= 70 ? 'var(--acc)' : score >= 50 ? 'var(--warm)' : 'var(--neg)',
                  border: `1px solid ${score >= 70 ? 'oklch(0.92 0.205 116 / 0.3)' : score >= 50 ? 'oklch(0.72 0.155 45 / 0.3)' : 'oklch(0.68 0.20 25 / 0.3)'}`,
                }}>
                  {scoreLabel}
                </span>
              </div>
              {summary && (
                <p style={{ margin: 0, color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.55 }}>
                  {summary}
                </p>
              )}
            </div>
          </div>

          {/* Pros & cons */}
          {(pros.length > 0 || cons.length > 0) && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24,
            }}>
              {pros.length > 0 && (
                <div style={{
                  background: 'var(--bg-1)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r-3)', padding: '24px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 16,
                  }}>
                    <CheckCircle size={15} strokeWidth={SW} style={{ color: 'var(--pos)', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                      letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--pos)',
                    }}>
                      A favor
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pros.map((pro, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--pos)', flexShrink: 0, marginTop: 2 }}>+</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div style={{
                  background: 'var(--bg-1)', border: '1px solid var(--line)',
                  borderRadius: 'var(--r-3)', padding: '24px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 16,
                  }}>
                    <AlertTriangle size={15} strokeWidth={SW} style={{ color: 'var(--warm)', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                      letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--warm)',
                    }}>
                      A tener en cuenta
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cons.map((con, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--fg-1)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--warm)', flexShrink: 0, marginTop: 2 }}>!</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {p.description_summary && (
            <div style={{
              background: 'var(--bg-1)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-3)', padding: '24px', marginBottom: 24,
            }}>
              <h3 style={{
                margin: '0 0 12px', fontSize: 13, fontWeight: 600,
                fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg-2)',
              }}>
                Descripción
              </h3>
              <p style={{ margin: 0, color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.6 }}>
                {p.description_summary}
              </p>
            </div>
          )}

          {/* CTA row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/feed" className="btn btn-ghost">← Volver al feed</a>
            {p.zonapropUrl && (
              <a
                href={p.zonapropUrl}
                className="btn btn-acc"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Ver publicación en Zonaprop <ExternalLink size={12} strokeWidth={SW} />
              </a>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
