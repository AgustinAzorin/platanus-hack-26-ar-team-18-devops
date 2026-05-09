'use client';

import { useState, type FormEvent } from 'react';
import type { AnalyzePropertyResponse } from '@repo/types';

import { ApiError, apiClient } from '../../lib/api-client';

export default function AnalyzePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzePropertyResponse | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await apiClient.analysis.analyze(url.trim());
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string | string[] } | null;
        const msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
        setError(msg ?? `Error ${err.status}`);
      } else {
        setError((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={S.main}>
      <header style={S.header}>
        <h1 style={S.h1}>Análisis de propiedad</h1>
        <p style={S.subtitle}>Pegá una URL de ZonaProp, MercadoLibre o Argenprop.</p>
      </header>

      <form onSubmit={onSubmit} style={S.form}>
        <input
          type="url"
          required
          placeholder="https://www.zonaprop.com.ar/propiedades/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          style={S.input}
        />
        <button type="submit" disabled={loading || !url.trim()} style={S.button}>
          {loading ? 'Analizando…' : 'Analizar'}
        </button>
      </form>

      {loading && (
        <div style={S.loading}>
          Esto puede tardar 30-90 segundos. Claude está investigando con web search…
        </div>
      )}

      {error && <div style={S.error}>⚠ {error}</div>}

      {result && <Report result={result} />}
    </main>
  );
}

function Report({ result }: { result: AnalyzePropertyResponse }) {
  const r = result.report;
  return (
    <section style={S.report}>
      <div style={S.scoreRow}>
        <ScoreBadge score={r.score} />
        <div>
          <h2 style={S.h2}>Score: {r.score}/10</h2>
          <p style={S.muted}>{r.score_justificacion}</p>
        </div>
      </div>

      {result.cached && <div style={S.cachedBadge}>resultado cacheado</div>}

      <Block title="Resumen ejecutivo">
        <p>{r.resumen_ejecutivo}</p>
      </Block>

      <Block title="Veredicto">
        <p style={S.veredicto}>{r.veredicto}</p>
      </Block>

      <Block title="Inmueble">
        <Field label="Estado y calidad" value={r.inmueble.estado_y_calidad} />
        <Field label="Equipamiento" value={r.inmueble.equipamiento} />
        <div style={S.costGrid}>
          <Cost label="Alquiler" value={r.inmueble.costo_total_estimado.alquiler} />
          <Cost label="Expensas" value={r.inmueble.costo_total_estimado.expensas} />
          <Cost label="ABL" value={r.inmueble.costo_total_estimado.abl_estimado} />
          <Cost label="Servicios" value={r.inmueble.costo_total_estimado.servicios_estimados} />
          <Cost
            label="Total mensual"
            value={r.inmueble.costo_total_estimado.total_mensual}
            highlight
          />
        </div>
        {r.inmueble.red_flags.length > 0 && (
          <div style={S.redFlags}>
            <strong>Red flags:</strong>
            <ul style={S.list}>
              {r.inmueble.red_flags.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </Block>

      <Block title="Entorno">
        <Field label="Seguridad" value={r.entorno.seguridad} />
        <Field label="Transporte" value={r.entorno.transporte} />
        <Field label="Educación" value={r.entorno.educacion} />
        <Field label="Salud" value={r.entorno.salud} />
        <Field label="Ocio" value={r.entorno.ocio} />
      </Block>

      <Block title="Preguntas para la inmobiliaria">
        <ul style={S.list}>
          {r.preguntas_inmobiliaria.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </Block>

      <details style={S.details}>
        <summary style={S.summary}>Ver JSON completo</summary>
        <pre style={S.pre}>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.block}>
      <h3 style={S.h3}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.field}>
      <span style={S.fieldLabel}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Cost({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div style={{ ...S.costCell, ...(highlight ? S.costCellHighlight : null) }}>
      <div style={S.costLabel}>{label}</div>
      <div style={S.costValue}>${value.toLocaleString('es-AR')}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? '#16a34a' : score >= 5 ? '#ca8a04' : '#dc2626';
  return (
    <div
      style={{
        ...S.scoreBadge,
        background: color,
      }}
    >
      {score}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: 760,
    margin: '0 auto',
    padding: '3rem 1.5rem',
    color: '#111',
  },
  header: { marginBottom: '2rem' },
  h1: { fontSize: '2rem', margin: 0, fontWeight: 600 },
  subtitle: { color: '#666', marginTop: '0.5rem' },
  form: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '1px solid #ddd',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'inherit',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    background: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  loading: {
    padding: '1rem',
    background: '#f5f5f5',
    border: '1px solid #e5e5e5',
    borderRadius: 6,
    color: '#555',
    fontSize: '0.9rem',
  },
  error: {
    padding: '1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: 6,
  },
  report: { marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  scoreRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  h2: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  h3: { margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 600, color: '#111' },
  muted: { color: '#666', margin: '0.25rem 0 0 0', fontSize: '0.9rem' },
  cachedBadge: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  block: {
    padding: '1.25rem',
    border: '1px solid #e5e5e5',
    borderRadius: 8,
    background: '#fafafa',
  },
  veredicto: { fontStyle: 'italic', margin: 0, lineHeight: 1.6 },
  field: { display: 'flex', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.95rem' },
  fieldLabel: { fontWeight: 600, minWidth: 120, color: '#555' },
  costGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.5rem',
    marginTop: '0.75rem',
  },
  costCell: {
    padding: '0.75rem',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: 6,
  },
  costCellHighlight: { background: '#111', color: '#fff', borderColor: '#111' },
  costLabel: { fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 },
  costValue: { fontSize: '1.1rem', fontWeight: 600, marginTop: '0.25rem' },
  redFlags: { marginTop: '0.75rem', color: '#991b1b' },
  list: { margin: '0.5rem 0 0 1rem', padding: 0, lineHeight: 1.6 },
  details: { marginTop: '0.5rem' },
  summary: { cursor: 'pointer', color: '#666', fontSize: '0.85rem' },
  pre: {
    background: '#1e1e1e',
    color: '#e5e5e5',
    padding: '1rem',
    borderRadius: 6,
    overflow: 'auto',
    fontSize: '0.8rem',
    marginTop: '0.5rem',
  },
};
