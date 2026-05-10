'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useIsomorphicLayoutEffect } from '../../lib/use-isomorphic-layout-effect';
import {
  ArrowRight, Sparkles, MapPin, DollarSign, Bed, Calendar,
  PawPrint, Home, UserCheck, ShieldCheck, ExternalLink, ArrowLeft, AlertTriangle,
} from 'lucide-react';

import {
  EMPTY_FILTERS, EMPTY_PROFILE,
  type ChatTurn, type ChatResponse, type ClientProfile, type SearchFilters,
  type BackendSearchResponse, type BackendSearchFilters, type SearchResultItem,
} from '../../lib/search/types';
import { composeSearchQuery } from '../../lib/search/compose-query';
import { apiClient } from '../../lib/api-client';
import AppSidebar from '../../components/app-sidebar';

const SW = 1.6;

function Topbar({ done }: { done: boolean }) {
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Buscar</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        {done ? 'Filtros listos' : 'Charlando con la IA'}
      </div>
      <div className="right">
        <div className="pill">
          <span className="pulse" />
          {done ? 'LISTO PARA BUSCAR' : 'IA INTERPRETANDO'}
        </div>
        <a href="/feed" className="btn btn-ghost">Ver propiedades</a>
      </div>
    </div>
  );
}

interface RailItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}

function buildSearchItems(filters: SearchFilters): RailItem[] {
  const out: RailItem[] = [];

  if (filters.neighborhoods.length > 0) {
    for (const n of filters.neighborhoods) {
      out.push({
        key: `neighborhood:${n}`,
        icon: <MapPin size={12} strokeWidth={SW} />,
        label: 'Zona',
        value: n,
      });
    }
  }

  if (filters.price_max !== null) {
    const symbol = filters.price_currency === 'USD' ? 'USD' : '$';
    out.push({
      key: 'price_max',
      icon: <DollarSign size={12} strokeWidth={SW} />,
      label: 'Hasta',
      value: `${symbol} ${new Intl.NumberFormat('es-AR').format(filters.price_max)}`,
    });
  }

  const { min_rooms, max_rooms } = filters;
  if (min_rooms !== null || max_rooms !== null) {
    let value: string;
    if (min_rooms !== null && max_rooms !== null && min_rooms === max_rooms) value = `${min_rooms} amb`;
    else if (min_rooms !== null && max_rooms !== null) value = `${min_rooms}–${max_rooms} amb`;
    else if (min_rooms !== null) value = `desde ${min_rooms} amb`;
    else value = `hasta ${max_rooms} amb`;
    out.push({
      key: 'rooms',
      icon: <Bed size={12} strokeWidth={SW} />,
      label: 'Ambientes',
      value,
    });
  }

  if (filters.move_in_date) {
    out.push({
      key: 'move_in_date',
      icon: <Calendar size={12} strokeWidth={SW} />,
      label: 'Mudanza',
      value: new Date(filters.move_in_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
    });
  }

  for (const f of filters.must_have_features) {
    out.push({
      key: `feature:${f}`,
      icon: <Sparkles size={12} strokeWidth={SW} />,
      label: 'Feature',
      value: f.replace(/_/g, ' '),
    });
  }

  return out;
}

function buildProfileItems(profile: ClientProfile): RailItem[] {
  const out: RailItem[] = [];

  if (profile.has_pet !== null) {
    out.push({
      key: 'has_pet',
      icon: <PawPrint size={12} strokeWidth={SW} />,
      label: 'Mascota',
      value: profile.has_pet ? (profile.pet_details ?? 'Sí') : 'No',
    });
  }

  if (profile.has_real_estate !== null) {
    out.push({
      key: 'has_real_estate',
      icon: <Home size={12} strokeWidth={SW} />,
      label: 'Propiedad',
      value: profile.has_real_estate ? (profile.real_estate_location ?? 'Sí') : 'No tiene',
    });
  }

  if (profile.has_guarantor !== null) {
    out.push({
      key: 'has_guarantor',
      icon: <UserCheck size={12} strokeWidth={SW} />,
      label: 'Garante',
      value: profile.has_guarantor ? (profile.guarantor_details ?? 'Sí') : 'No tiene',
    });
  }

  if (profile.caucion_status !== null) {
    const label = profile.caucion_status === 'has' ? 'Tiene'
      : profile.caucion_status === 'can_contract' ? 'Puede contratar'
      : 'No tiene';
    out.push({
      key: 'caucion_status',
      icon: <ShieldCheck size={12} strokeWidth={SW} />,
      label: 'Caución',
      value: label,
    });
  }

  return out;
}

function FiltersRail({
  filters, profile, done, onSearch, searching,
}: {
  filters: SearchFilters;
  profile: ClientProfile;
  done: boolean;
  onSearch: () => void;
  searching: boolean;
}) {
  const searchItems = buildSearchItems(filters);
  const profileItems = buildProfileItems(profile);

  return (
    <aside className="filters-rail">
      <h3>Búsqueda actual</h3>
      {searchItems.length === 0 ? (
        <div className="rail-empty">
          A medida que respondas, los filtros van a ir apareciendo acá.
        </div>
      ) : (
        <div className="rail-stack">
          {searchItems.map((it) => (
            <div key={it.key} className="rail-chip">
              <span className="rail-chip-icon">{it.icon}</span>
              <div className="rail-chip-text">
                <span className="rail-chip-label">{it.label}</span>
                <span className="rail-chip-value">{it.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ marginTop: 8 }}>Tu perfil</h3>
      {profileItems.length === 0 ? (
        <div className="rail-empty">
          Datos que se guardan una sola vez (mascota, propiedad, garante, caución).
        </div>
      ) : (
        <div className="rail-stack">
          {profileItems.map((it) => (
            <div key={it.key} className="rail-chip rail-chip-profile">
              <span className="rail-chip-icon rail-chip-icon-profile">{it.icon}</span>
              <div className="rail-chip-text">
                <span className="rail-chip-label">{it.label}</span>
                <span className="rail-chip-value">{it.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="search-go"
        disabled={!done || searching}
        onClick={onSearch}
      >
        {searching ? 'Procesando…' : done ? 'Ver proceso' : 'Seguí respondiendo…'}
      </button>
    </aside>
  );
}

// ─── Terminal-style process log ───────────────────────────────────────

export type LogLevel = 'cmd' | 'info' | 'data' | 'success' | 'error' | 'dim';
export interface LogLine {
  ts: string;        // "14:32:01"
  level: LogLevel;
  text: string;
}

const LOG_COLORS: Record<LogLevel, string> = {
  cmd:     'oklch(0.85 0.18 160)',     // cyan-ish accent for commands
  info:    'var(--fg-1)',
  data:    'var(--warm)',
  success: 'var(--acc)',
  error:   'var(--neg)',
  dim:     'var(--fg-3)',
};

interface TerminalViewProps {
  logs: LogLine[];
  running: boolean;
  resultCount: number | null;
  onShowResults: () => void;
  onBack: () => void;
}

function TerminalView({ logs, running, resultCount, onShowResults, onBack }: TerminalViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new lines arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <section className="search-thread thread">
      <div className="thread-head" style={{ padding: '14px 24px', gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          <ArrowLeft size={14} strokeWidth={SW} />
          Volver al chat
        </button>
        <div className="th-info" style={{ marginLeft: 4 }}>
          <div className="th-name">Log del proceso</div>
          <div className="th-sub">SEARCH PIPELINE · /search/query</div>
        </div>
        {!running && (
          <div style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: 'var(--acc)',
            fontFamily: '"JetBrains Mono", monospace',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acc)' }} />
            done
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1, minHeight: 0, overflowY: 'auto',
            background: 'oklch(0.07 0 0)',
            border: '1px solid oklch(0.18 0 0)',
            borderRadius: 12,
            padding: '16px 18px',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--fg-1)',
          }}
        >
          {logs.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
              <span style={{
                color: 'oklch(0.4 0 0)', userSelect: 'none', fontSize: 11, flex: 'none',
                width: 64,
              }}>
                {l.ts}
              </span>
              <span style={{ color: LOG_COLORS[l.level], whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {l.text || ' '}
              </span>
            </div>
          ))}
          {running && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ color: 'oklch(0.4 0 0)', width: 64 }} />
              <span style={{ color: 'var(--acc)' }} className="cursor-blink">▌</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onShowResults}
            disabled={running || resultCount === 0 || resultCount === null}
            style={{
              fontSize: 13, fontWeight: 500, padding: '10px 18px',
              background: !running && resultCount && resultCount > 0 ? 'var(--acc)' : 'var(--bg-2)',
              color: !running && resultCount && resultCount > 0 ? 'var(--acc-ink)' : 'var(--fg-3)',
              border: 0, borderRadius: 10,
              cursor: !running && resultCount && resultCount > 0 ? 'pointer' : 'not-allowed',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {running ? 'Procesando…' : resultCount === 0 ? 'Sin propiedades' : `Ver propiedades (${resultCount})`}
            {!running && resultCount && resultCount > 0 && <ArrowRight size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </section>
  );
}

function formatPrice(p: SearchResultItem): string {
  if (p.price_value === null) return 'Consultar';
  const symbol = p.price_type === 'USD' ? 'USD' : '$';
  return `${symbol} ${new Intl.NumberFormat('es-AR').format(p.price_value)}`;
}

function ResultsView({
  results,
  onBack,
}: {
  results: BackendSearchResponse;
  onBack: () => void;
}) {
  const meta = results.meta_report;
  const recommendedIds = new Set(meta?.top_recomendaciones.map((r) => r.analysis_id) ?? []);

  return (
    <section className="search-thread thread">
      <div className="thread-head" style={{ padding: '14px 24px', gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          <ArrowLeft size={14} strokeWidth={SW} />
          Volver al chat
        </button>
        <div className="th-info" style={{ marginLeft: 4 }}>
          <div className="th-name">Top {results.results.length} para contactar</div>
          <div className="th-sub">RANKEADAS POR SCORE · CLAUDE SONNET 4.6</div>
        </div>
      </div>

      <div className="msgs" style={{ flex: 1, overflowY: 'auto', padding: '20px 32px 32px' }}>
        {results.notice && (
          <div style={{
            padding: '10px 14px', borderRadius: 12, fontSize: 13,
            background: 'oklch(0.18 0.04 60 / 0.6)', color: 'var(--warm)',
            border: '1px solid oklch(0.5 0.12 60 / 0.4)', marginBottom: 16,
          }}>
            <AlertTriangle size={13} strokeWidth={SW} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            {results.notice}
          </div>
        )}

        {meta && (
          <div style={{
            padding: 18, borderRadius: 14, marginBottom: 24,
            border: '1px solid var(--line)', background: 'var(--bg-1)',
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 8,
            }}>Resumen IA</div>
            <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.5, color: 'var(--fg)' }}>
              {meta.resumen_busqueda}
            </p>
            {meta.trade_offs.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Trade-offs
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                  {meta.trade_offs.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
            {meta.alertas.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--neg)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Alertas
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                  {meta.alertas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {results.results.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 40, fontSize: 14, color: 'var(--fg-3)',
            border: '1px dashed var(--line)', borderRadius: 14,
          }}>
            No encontré propiedades con esos criterios. Probá relajar zona o presupuesto y volvé al chat.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {results.results.map((r) => {
              const recommended = recommendedIds.has(r.analysis_id);
              const recReason = meta?.top_recomendaciones.find((x) => x.analysis_id === r.analysis_id)?.razon;
              return (
                <article
                  key={r.analysis_id}
                  style={{
                    border: `1px solid ${recommended ? 'oklch(0.55 0.17 116 / 0.55)' : 'var(--line)'}`,
                    borderRadius: 16, padding: 16, background: 'var(--bg-1)',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg)', letterSpacing: '-0.01em' }}>
                        {r.address ?? 'Propiedad'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                        {r.neighborhood ?? '—'}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 999,
                      background: r.score >= 8 ? 'oklch(0.25 0.07 116 / 0.45)' : r.score >= 6 ? 'oklch(0.25 0.07 60 / 0.45)' : 'oklch(0.25 0.07 30 / 0.4)',
                      color: r.score >= 8 ? 'var(--acc)' : r.score >= 6 ? 'var(--warm)' : 'var(--fg-2)',
                      fontSize: 12, fontWeight: 600, fontFamily: '"JetBrains Mono", monospace',
                    }}>
                      {Math.round(r.score * 10)}/100
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: 'var(--fg)' }}>{formatPrice(r)}</span>
                    {r.rooms !== null && <span style={{ color: 'var(--fg-3)' }}>· {r.rooms} amb</span>}
                    {r.square_meters_area !== null && <span style={{ color: 'var(--fg-3)' }}>· {Math.round(r.square_meters_area)}m²</span>}
                  </div>

                  <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                    {r.resumen_ejecutivo}
                  </p>

                  {recommended && recReason && (
                    <div style={{
                      fontSize: 12, padding: 10, borderRadius: 10,
                      background: 'oklch(0.20 0.07 116 / 0.4)',
                      border: '1px solid oklch(0.55 0.17 116 / 0.4)',
                      color: 'var(--acc)',
                    }}>
                      <b>Top recomendación:</b> {recReason}
                    </div>
                  )}

                  {r.red_flags.length > 0 && (
                    <ul style={{ margin: '4px 0 0', paddingLeft: 16, fontSize: 12, color: 'var(--neg)', lineHeight: 1.4 }}>
                      {r.red_flags.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: 12, color: 'var(--acc)',
                      }}
                    >
                      Ver publicación <ExternalLink size={11} strokeWidth={SW} />
                    </a>
                    {r.seller_whatsapp_digits && (
                      <a
                        href={`https://wa.me/${r.seller_whatsapp_digits.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          marginLeft: 'auto',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 500,
                          padding: '6px 12px', borderRadius: 8,
                          background: 'oklch(0.55 0.17 150 / 0.25)',
                          border: '1px solid oklch(0.55 0.17 150 / 0.5)',
                          color: 'oklch(0.85 0.15 150)',
                        }}
                      >
                        Contactar +{r.seller_whatsapp_digits}
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

interface SearchClientProps {
  initialQuery: string;
}

/** Message that lives in the UI thread. Adds the optional suggestions/picked
 *  bookkeeping that the wire ChatTurn doesn't carry. */
interface UiMessage extends ChatTurn {
  suggestions?: string[];
  picked?: string;
}

export default function SearchClient({ initialQuery }: SearchClientProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [profile, setProfile] = useState<ClientProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BackendSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Stages: 'idle' (chat) → 'process' (terminal log) → 'results' (cards).
  type ViewStage = 'idle' | 'process' | 'results';
  const [viewStage, setViewStage] = useState<ViewStage>('idle');
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  // Auto-scroll the thread when messages change.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking]);

  // Skip SSR for the animated content so the entrance has a clean canvas.
  const [mounted, setMounted] = useState(false);
  const animatedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted || animatedRef.current) return;
    animatedRef.current = true;
    gsap.defaults({ ease: 'power3.out' });
    gsap.from('.side',          { x: -28, duration: 0.7 });
    gsap.from('.topbar',        { y: -16, duration: 0.6, delay: 0.08 });
    gsap.from('.search-thread', { y: 22,  duration: 0.65, delay: 0.18 });
    gsap.from('.filters-rail',  { x: 32,  duration: 0.7, delay: 0.24 });
  }, [mounted]);

  // Boot: if there's an initial query from /home, send it as the first user turn.
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    if (initialQuery.length === 0) {
      // Cold open: greet with a kickoff question.
      setMessages([
        { role: 'assistant', content: 'Hola! Contame qué tipo de depto buscás. Si querés, en una sola frase: zona, presupuesto y ambientes.' },
      ]);
      return;
    }
    void runTurn([{ role: 'user', content: initialQuery, source: 'typed' }], EMPTY_FILTERS);
  }, [initialQuery]);

  async function runTurn(nextMessages: UiMessage[], currentFilters: SearchFilters) {
    setMessages(nextMessages);
    setThinking(true);
    setError(null);
    try {
      // Strip UI-only fields (suggestions, picked) but KEEP source so the
      // backend has the complete history including pill selections.
      const wireMessages: ChatTurn[] = nextMessages.map(({ role, content, source }) => ({
        role, content, ...(source ? { source } : {}),
      }));
      const res = await fetch('/api/search/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: wireMessages, filters: currentFilters }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ChatResponse;
      setFilters(data.filters);
      setProfile(data.profile ?? EMPTY_PROFILE);
      setDone(data.done);
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: data.message, suggestions: data.suggestions ?? [] },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el agente');
    } finally {
      setThinking(false);
      composerRef.current?.focus();
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft('');
    await runTurn([...messages, { role: 'user', content: text, source: 'typed' }], filters);
  }

  /**
   * Pill click: append a `pill` user turn to messages so the agent has the
   * full conversation history (otherwise it re-asks questions). The thread
   * filters these out for rendering — only the "picked" highlight is shown
   * on the previous assistant's pill list.
   */
  function handleSuggestion(text: string) {
    if (thinking) return;
    const withPicked: UiMessage[] = messages.map((m, i) =>
      i === messages.length - 1 && m.role === 'assistant' ? { ...m, picked: text } : m,
    );
    void runTurn(
      [...withPicked, { role: 'user', content: text, source: 'pill' }],
      filters,
    );
  }

  async function handleSearch() {
    setSearching(true);
    setSearchError(null);
    setSearchResults(null);
    setLogs([]);
    setViewStage('process');

    const query = composeSearchQuery(filters, profile);
    const startedAt = Date.now();
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const stamp = () => new Date().toLocaleTimeString('es-AR', { hour12: false });

    // Buffer the lines locally so we can flush in order regardless of React batching.
    const queue: LogLine[] = [];
    const flush = (level: LogLevel, text: string) => {
      const line: LogLine = { ts: stamp(), level, text };
      queue.push(line);
      setLogs((prev) => [...prev, line]);
    };

    try {
      flush('cmd', `$ POST /search/query`);
      flush('dim', `  payload.query =`);
      const truncated = query.length > 100 ? query.slice(0, 97) + '…' : query;
      flush('info', `    "${truncated}"`);
      await wait(180);
      flush('dim', '');

      // Stage 1: translator
      flush('info', '── stage 1: translator ──────────────────');
      flush('cmd', '  anthropic.messages.create({');
      flush('cmd', '    model: "claude-sonnet-4-6",');
      flush('cmd', '    system: search-translation.prompt');
      flush('cmd', '  })');
      flush('dim', '  parsing natural language → SearchFilters (Zod)');

      const fetchPromise = apiClient.search.query(query);
      await wait(800);

      flush('success', '  ✓ filters parsed');
      flush('dim', '');

      // Stage 2: executor
      flush('info', '── stage 2: executor ────────────────────');
      flush('cmd', '  supabase.from("propiedades")');
      flush('cmd', '    .select(*)');
      flush('cmd', '    .in("neighborhood", [...])');
      flush('cmd', '    .lte("price_value", price_max)');
      flush('cmd', '    .eq("price_type", currency)');
      flush('cmd', '    .limit(200)');
      await wait(450);
      flush('cmd', '  voyage.embed(free_text_query, {');
      flush('cmd', '    model: "voyage-3", input_type: "query"');
      flush('cmd', '  }) → vector(1024)');
      await wait(450);
      flush('cmd', '  supabase.rpc("search_analyses_by_embedding", {');
      flush('cmd', '    query_embedding, urls, min_score, limit: 30');
      flush('cmd', '  })');

      const response = await fetchPromise;
      setSearchResults(response);

      flush('success', `  ✓ ${response.results.length} matches`);
      await wait(120);
      flush('dim', '');

      // Surface the actual filters the backend translator extracted.
      flush('data', `  filters.neighborhoods   = ${JSON.stringify(response.filters.neighborhoods)}`);
      flush('data', `  filters.price_max       = ${response.filters.price_max ?? 'null'} ${response.filters.price_currency}`);
      flush('data', `  filters.min_rooms       = ${response.filters.min_rooms ?? 'null'}`);
      flush('data', `  filters.max_rooms       = ${response.filters.max_rooms ?? 'null'}`);
      flush('data', `  filters.must_have       = ${JSON.stringify(response.filters.must_have_features)}`);
      flush('data', `  filters.min_score       = ${response.filters.min_score ?? 'null'}`);
      if (response.filters.free_text_query) {
        flush('data', `  filters.free_text_query = "${response.filters.free_text_query}"`);
      }
      flush('dim', '');

      // Stage 3: summarizer
      flush('info', '── stage 3: summarizer ──────────────────');
      flush('cmd', '  anthropic.messages.create({');
      flush('cmd', '    model: "claude-sonnet-4-6",');
      flush('cmd', '    system: search-summary.prompt');
      flush('cmd', '  })');
      flush('dim', '  building meta-report from top results');
      await wait(700);

      if (response.meta_report) {
        flush('success', '  ✓ meta-report ready');
        flush('data', `    top_recomendaciones = ${response.meta_report.top_recomendaciones.length}`);
        flush('data', `    trade_offs = ${response.meta_report.trade_offs.length}`);
        flush('data', `    alertas    = ${response.meta_report.alertas.length}`);
      } else {
        flush('dim', '  ⊘ skipped (sin resultados o no se generó)');
      }

      if (response.notice) {
        flush('dim', '');
        flush('error', `  ! notice: ${response.notice}`);
      }

      // ── Stage 4: enrich every raw result with /analysis/analyze ──────────
      // The agent will later message the top 5 listings, so we want the score
      // and summary on ALL of them before picking. Backend already filters out
      // listings without `seller_whatsapp_digits`, so everything here is
      // contactable.
      const ENRICH_LIMIT = 30;
      const BATCH_SIZE = 3; // parallel analyses per batch; respects Anthropic rate limits
      const fallbackItems = response.results
        .filter((r) => r.analysis_id.startsWith('prop:'))
        .slice(0, ENRICH_LIMIT);
      const total = fallbackItems.length;

      if (total > 0) {
        flush('dim', '');
        flush('info', `── stage 4: enriching ${total} contactable listings ──`);
        flush('dim', `  running /analysis/analyze in batches of ${BATCH_SIZE}`);
        flush('dim', '  (each call: claude-sonnet-4-6 + web_search + overpass + voyage)');

        let completed = 0;
        for (let i = 0; i < fallbackItems.length; i += BATCH_SIZE) {
          const batch = fallbackItems.slice(i, i + BATCH_SIZE);
          flush('cmd', `  [batch ${Math.floor(i / BATCH_SIZE) + 1}] starting ${batch.length} parallel analyses`);

          await Promise.all(batch.map(async (item) => {
            const postingId = item.analysis_id.replace(/^prop:/, '');
            const propStart = Date.now();
            try {
              const analyzed = await apiClient.analysis.analyzeByPostingId(postingId);
              const took = ((Date.now() - propStart) / 1000).toFixed(1);
              const score10 = (analyzed as { score?: number }).score ?? null;
              const score100 = score10 !== null ? Math.round(score10 * 10) : null;
              completed += 1;
              flush(
                'success',
                `    [${completed}/${total}] ✓ ${postingId}  ·  ${took}s${score100 !== null ? `  ·  score ${score100}/100` : ''}  ·  ${item.address?.slice(0, 40) ?? '—'}`,
              );
            } catch (e) {
              completed += 1;
              const msg = e instanceof Error ? e.message : 'analysis failed';
              flush('error', `    [${completed}/${total}] ✗ ${postingId}: ${msg}`);
            }
          }));
        }

        // Re-fetch search now that the analyses are persisted — the executor
        // will now sort by real score and the items will have summaries / red flags.
        flush('dim', '');
        flush('info', '── re-running search to pick up new analyses ──');
        try {
          const refreshed = await apiClient.search.query(query);

          // Filter to only contactable listings (defensive — backend already
          // does this) and pick top 5 by score.
          const TOP_N = 5;
          const top = refreshed.results
            .filter((r) => r.seller_whatsapp_digits && r.seller_whatsapp_digits.length > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, TOP_N);

          flush('success', `  ✓ refreshed: ${refreshed.results.length} contactable, picking top ${top.length} by score`);
          flush('dim', '');
          flush('info', '── top 5 (an agent will message them) ──');
          for (const [i, r] of top.entries()) {
            const score100 = Math.round(r.score * 10);
            const phone = r.seller_whatsapp_digits;
            flush('data', `  #${i + 1}  ${score100}/100  ·  +${phone}  ·  ${r.address?.slice(0, 50) ?? '—'}  ·  ${r.neighborhood ?? ''}`);
          }

          // Show only the top 5 in the ResultsView.
          setSearchResults({ ...refreshed, results: top });
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'refresh failed';
          flush('error', `  ✗ ${msg}`);
        }
      }

      flush('dim', '');
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);
      flush('cmd', `$ done in ${elapsed}s`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No pudimos hacer la búsqueda';
      flush('error', `✗ ${msg}`);
      setSearchError(msg);
    } finally {
      setSearching(false);
    }
  }

  function handleShowResults() {
    setViewStage('results');
  }

  function handleBackToChat() {
    setViewStage('idle');
    setSearchResults(null);
    setSearchError(null);
    setLogs([]);
  }

  // `messages` is already typed-only (pill clicks aren't added there). Render direct.
  // The thread shows assistant turns + only typed-user turns. Pill clicks live
  // in `messages` (so the agent sees them) but are surfaced via the highlighted
  // pill on the assistant message that prompted them — not as user bubbles.
  const visibleMessages = useMemo(
    () => messages.filter((m) => m.role !== 'user' || m.source !== 'pill'),
    [messages],
  );

  if (!mounted) return <div className="app" />;

  return (
    <div className="app">
      <AppSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
        <Topbar done={done} />
        <main className="search">

          {viewStage === 'results' && searchResults ? (
            <ResultsView results={searchResults} onBack={handleBackToChat} />
          ) : viewStage === 'process' ? (
            <TerminalView
              logs={logs}
              running={searching}
              resultCount={searchResults?.results.length ?? null}
              onShowResults={handleShowResults}
              onBack={handleBackToChat}
            />
          ) : (
          <section className="search-thread thread">
            <div className="thread-head" style={{ padding: '14px 24px' }}>
              <div
                className="th-av"
                style={{ background: 'oklch(0.32 0.10 290)', color: 'var(--fg)' }}
              >
                <Sparkles size={14} strokeWidth={SW} />
              </div>
              <div className="th-info">
                <div className="th-name">Casita IA</div>
                <div className="th-sub">BÚSQUEDA ASISTIDA · CLAUDE HAIKU 4.5</div>
              </div>
            </div>

            <div className="msgs" ref={scrollRef} style={{ flex: 1, overflowY: 'auto' }}>
              {visibleMessages.map((m, idx) => {
                const isLastAssistant = m.role === 'assistant'
                  && idx === visibleMessages.length - 1;
                const showPills = m.role === 'assistant'
                  && (m.suggestions?.length ?? 0) > 0;
                // Active = the most recent assistant turn AND we aren't waiting for a reply.
                const pillsActive = isLastAssistant && !thinking && !done;
                return (
                  <div key={idx}>
                    <div className={`msg ${m.role === 'user' ? 'out' : 'in'}`}>
                      <div className="bubble">{m.content}</div>
                    </div>
                    {showPills && (
                      <div className="quick-replies" role="group" aria-label="Respuestas sugeridas">
                        {m.suggestions!.map((s, i) => {
                          const isPicked = m.picked === s;
                          const className = pillsActive
                            ? `quick-reply${isPicked ? ' quick-reply-picked' : ''}`
                            : `quick-reply quick-reply-frozen${isPicked ? ' quick-reply-picked' : ''}`;
                          return (
                            <button
                              key={`${idx}-${i}-${s}`}
                              type="button"
                              className={className}
                              disabled={!pillsActive}
                              onClick={pillsActive ? () => handleSuggestion(s) : undefined}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {thinking && (
                <div className="msg in">
                  <div className="thinking"><span /><span /><span /></div>
                </div>
              )}
              {error && (
                <div className="msg in">
                  <div className="bubble" style={{ color: 'var(--neg)' }}>Error: {error}</div>
                </div>
              )}
            </div>

            <div className="thread-composer">
              <textarea
                ref={composerRef}
                rows={1}
                placeholder={done ? 'Listo, ya podés ver propiedades →' : 'Escribir respuesta…'}
                value={draft}
                disabled={thinking || done}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <button
                className="send-btn"
                aria-label="Enviar"
                disabled={thinking || done || !draft.trim()}
                onClick={() => void handleSend()}
              >
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
            {searchError && (
              <div style={{ color: 'var(--neg)', fontSize: 12, padding: '6px 24px 12px' }}>
                {searchError}
              </div>
            )}
          </section>
          )}

          <FiltersRail
            filters={filters}
            profile={profile}
            done={done}
            onSearch={handleSearch}
            searching={searching}
          />

        </main>
      </div>
    </div>
  );
}
