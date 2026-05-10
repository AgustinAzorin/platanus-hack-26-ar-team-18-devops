'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Layers, MessageSquare, Bell, BarChart2, Wand2,
} from 'lucide-react';

import { createClient as createBrowserSupabase } from '../lib/supabase/client';

const SW = 1.6;

interface NavItem {
  id: string;
  href: string;
  label: string;
  ico: keyof typeof navIcons;
  badgeKey?: 'unread_chats' | 'found' | 'pending';
  urgent?: boolean;
  group: 'principal' | 'operación';
}

const NAV: readonly NavItem[] = [
  { id: 'home',       href: '/home',       label: 'Buscar',          ico: 'search',                          group: 'principal' },
  { id: 'feed',       href: '/feed',       label: 'Encontrados',     ico: 'stack',  badgeKey: 'found',       group: 'principal' },
  { id: 'chats',      href: '/chats',      label: 'Conversaciones',  ico: 'chat',   badgeKey: 'unread_chats',group: 'principal' },
  { id: 'pending',    href: '/pending',    label: 'Pendientes',      ico: 'bell',   badgeKey: 'pending',    urgent: true, group: 'principal' },
] as const;

const navIcons = {
  search: <Search        size={16} strokeWidth={SW} />,
  stack:  <Layers        size={16} strokeWidth={SW} />,
  chat:   <MessageSquare size={16} strokeWidth={SW} />,
  bell:   <Bell          size={16} strokeWidth={SW} />,
  spark:  <BarChart2     size={16} strokeWidth={SW} />,
  wand:   <Wand2         size={16} strokeWidth={SW} />,
} as const;

interface SidebarCounts {
  unread_chats: number;
  found: number;
  pending: number;
}

const EMPTY_COUNTS: SidebarCounts = { unread_chats: 0, found: 0, pending: 0 };

export interface AppSidebarProps {
  /** Initial counts rendered server-side; overridden by client refresh + realtime. */
  initialCounts?: Partial<SidebarCounts>;
}

export default function AppSidebar({ initialCounts }: AppSidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<SidebarCounts>({ ...EMPTY_COUNTS, ...initialCounts });

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch('/api/sidebar-counts', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as SidebarCounts;
        if (!cancelled) setCounts(data);
      } catch {
        // Best-effort: silent fail.
      }
    }
    void refresh();

    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel('sidebar-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        void refresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        void refresh();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const groups = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <aside className="side">
      <Link
        href="/home"
        className="brand"
        aria-label="Ir al inicio"
        onClick={(e) => {
          if (pathname === '/home') {
            // Already on home: full reload so the composer + animations reset.
            e.preventDefault();
            window.location.href = '/home';
          }
        }}
      >
        <div className="mark">c.</div>
        <div className="name">casita<span style={{ color: 'var(--fg-3)' }}>·</span>fast</div>
        <div className="meta">v0.4</div>
      </Link>
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <div className="group-label">{group}</div>
          <div className="nav">
            {items.map((item) => {
              const active = isActive(pathname, item.href);
              const count = item.badgeKey ? counts[item.badgeKey] : 0;
              const showBadge = item.badgeKey !== undefined && count > 0;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`${active ? 'active' : ''} ${item.urgent && showBadge ? 'urgent' : ''}`}
                >
                  <span className="ico">{navIcons[item.ico]}</span>
                  <span>{item.label}</span>
                  {showBadge && <span className="badge">{formatBadge(count)}</span>}
                </a>
              );
            })}
          </div>
        </div>
      ))}
      <div className="side-foot">
        <div className="user">
          <div className="avatar">M</div>
          <div className="who">
            Martina Ríos
            <small>Plan agente · BA</small>
          </div>
          <div className="status" title="Bot activo" />
        </div>
      </div>
    </aside>
  );
}

function formatBadge(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  // /search is reached from the "home" search button; keep "Buscar" highlighted there.
  if (href === '/home' && pathname.startsWith('/search')) return true;
  return false;
}
