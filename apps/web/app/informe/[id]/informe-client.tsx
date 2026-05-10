'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import type { AnalysisReport } from '@repo/types';

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
  feedScore: number;
  analysisReport: AnalysisReport | null;
  analysisCreatedAt: string | null;
  apiUrl: string;
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
  const color = score >= 8 ? '#16a34a' : score >= 5 ? '#ca8a04' : '#dc2626';
  const percentage = Math.round((score / 10) * 100);

  return (
    <div
      style={{
        width: 80, height: 80, borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 700, flexShrink: 0,
        boxShadow: `0 0 0 8px color-mix(in oklch, ${color} 15%, transparent)`,
      }}
    >
      <div>{score}</div>
      <div style={{ fontSize: 10, opacity: 0.8 }}>/10</div>
    </div>
  );
}

export default function InformeClient({
  feedScore,
  analysisReport: analysis,
  analysisCreatedAt,
  apiUrl,
  property: p,
}: InformeClientProps) {
  const cover = p.image_urls[0] ?? null;
  const title = buildTitle(p);
  const price = formatPrice(p.price_value, p.price_type);
  const exp = p.expenses_value ? `+ ${formatPrice(p.expenses_value, null)} expensas` : null;

  const [isAnalyzing, setIsAnalyzing] = useState(!analysis);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Si no existe análisis, disparar uno en background
  useEffect(() => {
    if (analysis || !p.neighborhood) return;

    const triggerAnalysis = async () => {
      try {
        const res = await fetch(`${apiUrl}/analysis/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ neighborhood: p.neighborhood }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
          setAnalysisError((err as Record<string, string>).message || 'No se pudo analizar la propiedad');
          setIsAnalyzing(false);
        } else {
          // El análisis se guardó. En producción, refrescaríamos la página.
          // Para ahora, solo dejamos que el usuario la recargue.
          setIsAnalyzing(false);
        }
      } catch (err) {
        setAnalysisError((err as Error).message || 'Error de conexión');
        setIsAnalyzing(false);
      }
    };

    const timer = setTimeout(triggerAnalysis, 500);
    return () => clearTimeout(timer);
  }, [analysis, p.neighborhood]);

  if (!analysis) {
    return (
      <div className="app">
        <AppSidebar />
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="topbar">
            <div className="crumb">
              <a href="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)' }}>
                <ArrowLeft size={14} strokeWidth={SW} /> Volver al feed
              </a>
              <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
              <b>Informe IA</b>
            </div>
            {p.zonapropUrl && (
              <div className="right">
                <a
                  href={p.zonapropUrl}
                  className="btn btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Ver en Zonaprop <ExternalLink size={12} strokeWidth={SW} />
                </a>
              </div>
            )}
          </div>

          <main style={{ padding: '40px 56px 80px', maxWidth: 900, width: '100%' }}>
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              {isAnalyzing ? (
                <>
                  <Loader size={40} style={{ margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
                  <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 600 }}>Generando informe completo…</h2>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                    Claude está analizando esta propiedad con web search. Esto puede tardar 30-90 segundos.
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>Podés volver y recargar la página en unos momentos.</p>
                </>
              ) : analysisError ? (
                <>
                  <AlertTriangle size={40} style={{ margin: '0 auto 20px', color: 'var(--neg)' }} />
                  <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 600, color: 'var(--neg)' }}>No se pudo generar el informe</h2>
                  <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>{analysisError}</p>
                </>
              ) : null}
            </div>
          </main>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Si existe análisis, mostrar completo
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
            {analysisCreatedAt && (
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                {minutesAgo(analysisCreatedAt).toUpperCase()}
              </span>
            )}
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
            ANÁLISIS COMPLETO IA
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
                    <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {Math.round(p.square_meters_area)} m²
                    </span>
                  )}
                  {p.rooms && (
                    <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.rooms} amb.
                    </span>
                  )}
                  {p.bedrooms && (
                    <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.bedrooms} dorm.
                    </span>
                  )}
                  {p.bathrooms && (
                    <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      {p.bathrooms} baño{p.bathrooms > 1 ? 's' : ''}
                    </span>
                  )}
                  {p.parking ? (
                    <span style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', padding: '4px 10px', borderRadius: 999, fontSize: 12 }}>
                      cochera
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Score + justificación */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)', padding: '28px', marginBottom: 24,
            display: 'flex', gap: 24, alignItems: 'flex-start',
          }}>
            <ScoreBadge score={analysis.score} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
                Análisis: {analysis.score}/10
              </h2>
              <p style={{ margin: '0 0 12px', color: 'var(--fg-2)', fontSize: 13 }}>
                {analysis.score_justificacion}
              </p>
              <p style={{ margin: 0, color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.55, fontStyle: 'italic' }}>
                {analysis.resumen_ejecutivo}
              </p>
            </div>
          </div>

          {/* Veredicto */}
          <div style={{
            background: 'oklch(0.92 0.205 116 / 0.08)', border: '1px solid oklch(0.92 0.205 116 / 0.3)',
            borderRadius: 'var(--r-3)', padding: '20px 24px', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <CheckCircle size={18} strokeWidth={SW} style={{ color: 'var(--acc)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: 'var(--acc)' }}>VEREDICTO</h3>
                <p style={{ margin: 0, color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.55 }}>
                  {analysis.veredicto}
                </p>
              </div>
            </div>
          </div>

          {/* Inmueble */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)', padding: '24px', marginBottom: 24,
          }}>
            <h3 style={{
              margin: '0 0 18px', fontSize: 14, fontWeight: 600,
              fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--fg)',
            }}>
              Inmueble
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 4 }}>Estado y calidad</div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.55 }}>
                  {analysis.inmueble.estado_y_calidad}
                </p>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 4 }}>Equipamiento</div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.55 }}>
                  {analysis.inmueble.equipamiento}
                </p>
              </div>

              {/* Costos */}
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>Costo total estimado mensual</div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '8px',
                }}>
                  {[
                    ['Alquiler', analysis.inmueble.costo_total_estimado.alquiler],
                    ['Expensas', analysis.inmueble.costo_total_estimado.expensas],
                    ['ABL', analysis.inmueble.costo_total_estimado.abl_estimado],
                    ['Servicios', analysis.inmueble.costo_total_estimado.servicios_estimados],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--line)',
                        borderRadius: 'var(--r-1)',
                      }}
                    >
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 4 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>
                        ${(value as number).toLocaleString('es-AR')}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 10, padding: '12px 14px', background: '#111', color: '#fff',
                    border: '1px solid #333', borderRadius: 'var(--r-1)',
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>
                    Total mensual
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    ${analysis.inmueble.costo_total_estimado.total_mensual.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Red flags */}
              {analysis.inmueble.red_flags.length > 0 && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, textTransform: 'uppercase', color: 'var(--neg)', marginBottom: 10,
                  }}>
                    <AlertTriangle size={13} strokeWidth={SW} />
                    Red flags
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analysis.inmueble.red_flags.map((flag, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--neg)' }}>
                        <span style={{ flexShrink: 0 }}>!</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Entorno */}
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)', padding: '24px', marginBottom: 24,
          }}>
            <h3 style={{
              margin: '0 0 18px', fontSize: 14, fontWeight: 600,
              fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--fg)',
            }}>
              Entorno
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Seguridad', analysis.entorno.seguridad],
                ['Transporte', analysis.entorno.transporte],
                ['Educación', analysis.entorno.educacion],
                ['Salud', analysis.entorno.salud],
                ['Ocio', analysis.entorno.ocio],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 4 }}>
                    {label}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.55 }}>
                    {value as string}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Preguntas para la inmobiliaria */}
          {analysis.preguntas_inmobiliaria.length > 0 && (
            <div style={{
              background: 'var(--bg-1)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-3)', padding: '24px', marginBottom: 24,
            }}>
              <h3 style={{
                margin: '0 0 14px', fontSize: 14, fontWeight: 600,
                fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--fg)',
              }}>
                Preguntas para la inmobiliaria
              </h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {analysis.preguntas_inmobiliaria.map((q, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--fg-1)' }}>
                    <span style={{ flexShrink: 0, marginTop: 2 }}>→</span>
                    {q}
                  </li>
                ))}
              </ul>
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
