'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Search,
  Mail, MessageCircle, MoreVertical, ArrowRight, Calendar, DollarSign, Clock,
} from 'lucide-react';

import type { ChatMessage, ChatSummary, FeaturedProperty } from './data';
import { createClient as createBrowserSupabase } from '../../lib/supabase/client';
import AppSidebar from '../../components/app-sidebar';

const SW = 1.6;

const avatarColors = [
  'oklch(0.35 0.12 180)',
  'oklch(0.32 0.10 290)',
  'oklch(0.30 0.08 45)',
  'oklch(0.33 0.11 130)',
  'oklch(0.31 0.09 320)',
  'oklch(0.34 0.12 200)',
  'oklch(0.32 0.10 60)',
  'oklch(0.30 0.11 260)',
  'oklch(0.35 0.08 100)',
  'oklch(0.31 0.10 15)',
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarColors[h % avatarColors.length]!;
}

function initialsFor(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'P';
  }
  const tail = phone.replace(/\D/g, '').slice(-2);
  return tail.length === 2 ? tail : 'WA';
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.round((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return d.toLocaleDateString('es-AR', { weekday: 'short' });
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

const WaIcon  = () => <MessageCircle size={8} strokeWidth={2} />;
const MailIcon = () => <Mail          size={8} strokeWidth={2} />;

function Topbar({ activeChat }: { activeChat: ChatSummary | null }) {
  const subject = activeChat
    ? `${activeChat.contact_name ?? activeChat.phone_e164}${activeChat.propiedad_label ? ` · ${activeChat.propiedad_label}` : ''}`
    : 'Sin conversación seleccionada';
  return (
    <div className="topbar">
      <div className="crumb">
        <b>Conversaciones</b>
        <span style={{ color: 'var(--fg-3)', margin: '0 8px' }}>/</span>
        {subject}
      </div>
      <div className="right">
        <div className="pill">
          <span className="pulse" />
          BOT ACTIVO
        </div>
        <a href="/feed" className="btn btn-ghost">Ver propiedades</a>
        <a href="#" className="btn btn-acc">Conectar WhatsApp <span className="arrow">↗</span></a>
      </div>
    </div>
  );
}

interface ChatsClientProps {
  featured: FeaturedProperty | null;
  chats: ChatSummary[];
  initialChatId: string | null;
  initialMessages: ChatMessage[];
}

export default function ChatsClient({ featured, chats: initialChats, initialChatId, initialMessages }: ChatsClientProps) {
  const [chats, setChats] = useState<ChatSummary[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>(
    initialChatId ? { [initialChatId]: initialMessages } : {},
  );
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = useMemo(
    () => (activeChatId ? chats.find((c) => c.id === activeChatId) ?? null : null),
    [activeChatId, chats],
  );
  const activeMessages = useMemo(
    () => (activeChatId ? messagesByChat[activeChatId] ?? [] : []),
    [activeChatId, messagesByChat],
  );

  // Load messages on chat change.
  useEffect(() => {
    if (!activeChatId || messagesByChat[activeChatId]) return;
    const supabase = createBrowserSupabase();
    supabase
      .from('messages')
      .select('id, chat_id, direction, body, kind, status, created_at')
      .eq('chat_id', activeChatId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data) return;
        setMessagesByChat((prev) => ({ ...prev, [activeChatId]: data as ChatMessage[] }));
      });
  }, [activeChatId, messagesByChat]);

  // Realtime: new messages and chat upserts.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel('chats-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessagesByChat((prev) => {
            const list = prev[msg.chat_id] ?? [];
            if (list.some((m) => m.id === msg.id)) return prev;
            return { ...prev, [msg.chat_id]: [...list, msg] };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessagesByChat((prev) => {
            const list = prev[msg.chat_id];
            if (!list) return prev;
            return {
              ...prev,
              [msg.chat_id]: list.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)),
            };
          });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          // Just refetch the list — cheaper than reconciling each event.
          supabase
            .from('chats')
            .select('id, phone_e164, contact_name, propiedad_posting_id, last_message_at, last_inbound_at, unread_count')
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .then(({ data }) => {
              if (!data) return;
              setChats((prev) =>
                (data as ChatSummary[]).map((c) => {
                  const existing = prev.find((p) => p.id === c.id);
                  return {
                    ...c,
                    propiedad_label: existing?.propiedad_label ?? null,
                    last_message_preview: existing?.last_message_preview ?? null,
                  };
                }),
              );
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    initAnimations();
  }, []);

  function initAnimations() {
    gsap.defaults({ ease: 'power3.out' });

    gsap.from('.side',   { x: -24, autoAlpha: 0, duration: 1.0 });
    gsap.from('.topbar', { y: -12, autoAlpha: 0, duration: 0.85, delay: 0.12 });
    gsap.from('.convo', { x: -20, autoAlpha: 0, duration: 0.65, ease: 'power2.out', stagger: 0.06, delay: 0.28 });
    gsap.from('.thread-head', { autoAlpha: 0, y: -10, duration: 0.7, delay: 0.4 });
    gsap.from('.msg', { y: 18, autoAlpha: 0, duration: 0.55, ease: 'power2.out', stagger: 0.07, delay: 0.55 });
    gsap.from('.ctx', { x: 32, autoAlpha: 0, duration: 0.85, ease: 'power2.out', delay: 0.35 });
  }

  async function handleSend() {
    if (!activeChatId || !draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    const body = draft.trim();
    try {
      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      setDraft('');
      composerRef.current?.focus();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app">
      <AppSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar activeChat={activeChat} />
        <main className="chats">

          {/* ── Conversation list ─────────────────────── */}
          <aside className="convo-list">
            <div className="cl-head">
              <h2>Conversaciones</h2>
              <div className="cl-search">
                <Search size={14} strokeWidth={SW} />
                <input type="text" placeholder="Buscar conversación…" />
              </div>
            </div>
            <div className="cl-filters">
              <button className="cl-pill on">Todos</button>
              <button className="cl-pill">Sin leer</button>
              <button className="cl-pill">En oferta</button>
            </div>
            <div className="cl-list">
              {chats.length === 0 ? (
                <div style={{ padding: 24, color: 'var(--fg-3)', fontSize: 12, lineHeight: 1.5 }}>
                  Sin conversaciones todavía. Cuando alguien escriba a tu número de WhatsApp Business
                  o inicies un chat desde una propiedad, va a aparecer acá.
                </div>
              ) : (
                chats.map((c) => {
                  const name = c.contact_name ?? c.phone_e164;
                  const color = colorFor(c.phone_e164);
                  const initials = initialsFor(c.contact_name, c.phone_e164);
                  return (
                    <div
                      key={c.id}
                      className={`convo${c.id === activeChatId ? ' active' : ''}`}
                      onClick={() => setActiveChatId(c.id)}
                    >
                      <div className="av" style={{ background: color, color: 'var(--fg)' }}>
                        {initials}
                        <div
                          className="src-badge"
                          style={{ background: 'oklch(0.55 0.17 150)', color: 'var(--fg)' }}
                        >
                          <WaIcon />
                        </div>
                      </div>
                      <div className="info">
                        <div className="row1">
                          <span className="name">{name}</span>
                          <span className="time">{formatTime(c.last_message_at)}</span>
                        </div>
                        <div className="preview">
                          {c.propiedad_label && <span className="prop-tag">{c.propiedad_label}</span>}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.last_message_preview ?? '—'}
                          </span>
                        </div>
                      </div>
                      {c.unread_count > 1 ? (
                        <span className="badge-count">{c.unread_count}</span>
                      ) : c.unread_count === 1 ? (
                        <span className="badge-dot" />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Thread ───────────────────────────────── */}
          <section className="thread">
            <div className="thread-head">
              {activeChat ? (
                <>
                  <div
                    className="th-av"
                    style={{ background: colorFor(activeChat.phone_e164), color: 'var(--fg)' }}
                  >
                    {initialsFor(activeChat.contact_name, activeChat.phone_e164)}
                  </div>
                  <div className="th-info">
                    <div className="th-name">{activeChat.contact_name ?? activeChat.phone_e164}</div>
                    <div className="th-sub">
                      {activeChat.propiedad_label
                        ? `${activeChat.propiedad_label.toUpperCase()} · ${activeChat.phone_e164}`
                        : activeChat.phone_e164}
                    </div>
                  </div>
                </>
              ) : (
                <div className="th-info">
                  <div className="th-name" style={{ color: 'var(--fg-3)' }}>
                    Elegí una conversación
                  </div>
                </div>
              )}
              <div className="th-actions">
                <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                  Ver propiedad
                </button>
                <button className="icon-btn">
                  <MoreVertical size={14} strokeWidth={SW} />
                </button>
              </div>
            </div>

            <div className="msgs">
              {activeMessages.map((m) => (
                <div key={m.id} className={`msg ${m.direction === 'in' ? 'in' : 'out'}`}>
                  <div className="bubble">
                    {m.body ?? `[${m.kind}]`}
                    <span className="ts">
                      {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {m.direction === 'out' && m.status ? ` · ${m.status}` : ''}
                    </span>
                  </div>
                </div>
              ))}
              {activeMessages.length === 0 && activeChat && (
                <div style={{ color: 'var(--fg-3)', fontSize: 12, padding: 16 }}>
                  Sin mensajes aún. Escribí abajo para mandar el primero.
                </div>
              )}
            </div>

            <div className="thread-composer">
              <textarea
                ref={composerRef}
                rows={1}
                placeholder={activeChat ? 'Escribir mensaje…' : 'Elegí una conversación primero'}
                value={draft}
                disabled={!activeChat || sending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                className="send-btn"
                aria-label="Enviar"
                disabled={!activeChat || !draft.trim() || sending}
                onClick={handleSend}
              >
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
            {sendError && (
              <div style={{ color: 'var(--neg)', fontSize: 12, padding: '6px 16px' }}>
                {sendError}
              </div>
            )}
          </section>

          {/* ── Context rail ─────────────────────────── */}
          <aside className="ctx">
            <div className="ctx-card ctx-prop">
              <div
                className={`prop-img${featured?.imgUrl ? ' prop-img-photo' : ''}`}
                style={featured?.imgUrl ? { backgroundImage: `url("${featured.imgUrl}")` } : undefined}
              >
                {!featured?.imgUrl && <div className="prop-img-ph">🏠</div>}
              </div>
              <div className="prop-body">
                <div className="prop-name">{featured?.title ?? 'Depto. 3 amb. Palermo'}</div>
                <div className="prop-addr">{featured?.address ?? 'NICARAGUA 4800, PISO 3 · PALERMO'}</div>
                <div className="prop-price">{featured?.price ?? '$880.000'}</div>
                <div className="prop-tags">
                  {(featured?.specs ?? ['70m²', '2 dorm', '1 baño', 'balcón']).map((s, i) => (
                    <span key={i} className="prop-tag">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ctx-card ctx-stats">
              <h4>Estado del chat</h4>
              <div className="ctx-row">
                <span>Teléfono</span>
                <span className="val">{activeChat?.phone_e164 ?? '—'}</span>
              </div>
              <div className="ctx-row">
                <span>Última entrante</span>
                <span className="val">{formatTime(activeChat?.last_inbound_at ?? null) || '—'}</span>
              </div>
              <div className="ctx-row">
                <span>Mensajes</span>
                <span className="val">{activeMessages.length}</span>
              </div>
              <div className="ctx-row">
                <span>Sin leer</span>
                <span className="val">{activeChat?.unread_count ?? 0}</span>
              </div>
            </div>

            <div className="ctx-card ctx-intents">
              <h4>Intenciones detectadas</h4>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.25 0.08 116)', color: 'var(--acc)' }}
                >
                  <Calendar size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">Sin intenciones</div>
                  <div className="intent-sub">Se completa con IA</div>
                </div>
              </div>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.25 0.08 45)', color: 'var(--warm)' }}
                >
                  <DollarSign size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">—</div>
                  <div className="intent-sub">—</div>
                </div>
              </div>
              <div className="intent-item">
                <div
                  className="intent-icon"
                  style={{ background: 'oklch(0.22 0.06 220)', color: 'var(--fg-2)' }}
                >
                  <Clock size={13} strokeWidth={SW} />
                </div>
                <div className="intent-body">
                  <div className="intent-label">—</div>
                  <div className="intent-sub">—</div>
                </div>
              </div>
            </div>

            <div className="ctx-card ctx-actions">
              <h4>Acciones rápidas</h4>
              <button className="btn btn-acc" style={{ justifyContent: 'center' }}>
                Confirmar visita
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 12.5 }}>
                Enviar contrapropuesta
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 12.5, color: 'var(--neg)' }}>
                Descartar propiedad
              </button>
            </div>
          </aside>

        </main>
      </div>
    </div>
  );
}

// Suppress mail icon unused warning (kept for parity with old layout if re-enabled).
void MailIcon;
