'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Sparkles, MapPin, DollarSign, Bed, Calendar,
  PawPrint, Home, UserCheck, ShieldCheck,
} from 'lucide-react';

import {
  EMPTY_FILTERS, EMPTY_PROFILE,
  type ChatTurn, type ChatResponse, type ClientProfile, type SearchFilters,
} from '../../lib/search/types';
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

function FiltersRail({ filters, profile, done, onSearch, searching }: { filters: SearchFilters; profile: ClientProfile; done: boolean; onSearch: () => void; searching: boolean }) {
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
        {searching ? 'Buscando…' : done ? 'Ver propiedades' : 'Seguí respondiendo…'}
      </button>
    </aside>
  );
}

interface SearchClientProps {
  initialQuery: string;
}

export default function SearchClient({ initialQuery }: SearchClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [profile, setProfile] = useState<ClientProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  // Auto-scroll the thread when messages change.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, thinking, suggestions.length]);

  // No GSAP entrance animations here: the agent re-renders the page while
  // tweens are still running, leaving elements stuck at autoAlpha:0. If we
  // want fade-ins later, do them via CSS keyframes (independent from React state).

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
    void runTurn([{ role: 'user', content: initialQuery }], EMPTY_FILTERS);
  }, [initialQuery]);

  async function runTurn(nextMessages: ChatTurn[], currentFilters: SearchFilters) {
    setMessages(nextMessages);
    setThinking(true);
    setSuggestions([]); // hide stale chips while waiting
    setError(null);
    try {
      const res = await fetch('/api/search/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, filters: currentFilters }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as ChatResponse;
      setFilters(data.filters);
      setProfile(data.profile ?? EMPTY_PROFILE);
      setDone(data.done);
      setSuggestions(data.suggestions ?? []);
      setMessages([...nextMessages, { role: 'assistant', content: data.message }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el agente');
    } finally {
      setThinking(false);
      composerRef.current?.focus();
    }
  }

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? draft).trim();
    if (!text || thinking) return;
    setDraft('');
    setSuggestions([]); // user already chose; clear chips
    await runTurn([...messages, { role: 'user', content: text }], filters);
  }

  function handleSuggestion(text: string) {
    void handleSend(text);
  }

  async function handleSearch() {
    setSearching(true);
    try {
      // For now redirect to /feed with the filters in the URL. Wire to /search/query later.
      const params = new URLSearchParams();
      if (filters.neighborhoods.length > 0) params.set('neighborhoods', filters.neighborhoods.join(','));
      if (filters.price_max !== null) params.set('price_max', String(filters.price_max));
      if (filters.min_rooms !== null) params.set('min_rooms', String(filters.min_rooms));
      if (filters.max_rooms !== null) params.set('max_rooms', String(filters.max_rooms));
      if (filters.must_have_features.length > 0) params.set('features', filters.must_have_features.join(','));
      router.push(`/feed?${params.toString()}`);
    } finally {
      setSearching(false);
    }
  }

  const visibleMessages = useMemo(() => messages, [messages]);

  return (
    <div className="app">
      <AppSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
        <Topbar done={done} />
        <main className="search">

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
              {visibleMessages.map((m, idx) => (
                <div key={idx} className={`msg ${m.role === 'user' ? 'out' : 'in'}`}>
                  <div className="bubble">{m.content}</div>
                </div>
              ))}
              {thinking && (
                <div className="msg in">
                  <div className="thinking"><span /><span /><span /></div>
                </div>
              )}
              {!thinking && !done && suggestions.length > 0 && (
                <div className="quick-replies" role="group" aria-label="Respuestas sugeridas">
                  {suggestions.map((s, i) => (
                    <button
                      key={`${i}-${s}`}
                      type="button"
                      className="quick-reply"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
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
          </section>

          <FiltersRail filters={filters} profile={profile} done={done} onSearch={handleSearch} searching={searching} />

        </main>
      </div>
    </div>
  );
}
