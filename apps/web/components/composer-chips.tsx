'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, SlidersHorizontal, PawPrint, Search, X, Check,
} from 'lucide-react';

const SW = 1.6;

// Barrios + áreas principales. The user can also type their own and add it
// as a free chip. Order roughly by popularity in CABA renting market.
const ZONE_OPTIONS: readonly string[] = [
  'Palermo', 'Villa Crespo', 'Caballito', 'Recoleta', 'Belgrano',
  'Núñez', 'Colegiales', 'Chacarita', 'Almagro', 'Boedo',
  'Saavedra', 'Flores', 'San Telmo', 'Microcentro', 'Once',
  'Congreso', 'Retiro', 'Puerto Madero', 'Abasto', 'Villa Urquiza',
  'Villa Devoto', 'Barracas', 'La Boca', 'Parque Chacabuco', 'Mataderos',
  // GBA Norte / Sur
  'Vicente López', 'San Isidro', 'Tigre', 'San Fernando', 'Olivos',
  'Martínez', 'Florida', 'Munro', 'Acassuso',
  'Quilmes', 'Avellaneda', 'Lomas de Zamora', 'Banfield', 'Adrogué',
];

export interface ComposerChipsValue {
  zones: string[];                   // selected neighborhoods
  budget: { amount: number; currency: 'ARS' | 'USD' } | null;
  hasPet: boolean;
}

export const EMPTY_COMPOSER_CHIPS: ComposerChipsValue = {
  zones: [],
  budget: null,
  hasPet: false,
};

interface Props {
  value: ComposerChipsValue;
  onChange: (next: ComposerChipsValue) => void;
}

type OpenChip = 'zones' | 'budget' | null;

export default function ComposerChips({ value, onChange }: Props) {
  const [open, setOpen] = useState<OpenChip>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const zonesAnchorRef = useRef<HTMLButtonElement>(null);
  const budgetAnchorRef = useRef<HTMLButtonElement>(null);

  // Click-outside to close any open popover. Since the popover is portaled into
  // document.body, we also have to check it explicitly via popoverRef.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      const inRoot = rootRef.current?.contains(target) ?? false;
      const inPopover = popoverRef.current?.contains(target) ?? false;
      if (!inRoot && !inPopover) setOpen(null);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Esc closes the popover.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div
      ref={rootRef}
      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
    >
      <ChipButton
        ref={zonesAnchorRef}
        active={value.zones.length > 0}
        icon={<MapPin size={13} strokeWidth={SW} />}
        label={value.zones.length === 0 ? 'Zona' : `Zona · ${value.zones.length}`}
        onClick={() => setOpen(open === 'zones' ? null : 'zones')}
      />
      <ChipButton
        ref={budgetAnchorRef}
        active={value.budget !== null}
        icon={<SlidersHorizontal size={13} strokeWidth={SW} />}
        label={value.budget ? formatBudget(value.budget) : 'Presupuesto'}
        onClick={() => setOpen(open === 'budget' ? null : 'budget')}
      />
      <ChipButton
        active={value.hasPet}
        icon={<PawPrint size={13} strokeWidth={SW} />}
        label={value.hasPet ? 'Tengo mascota' : 'Mascotas'}
        onClick={() => onChange({ ...value, hasPet: !value.hasPet })}
      />

      {open === 'zones' && (
        <Popover anchorRef={zonesAnchorRef} minWidth={300} maxWidth={360} maxHeight={360}>
          <div ref={popoverRef} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 360 }}>
            <ZonesPopoverBody
              selected={value.zones}
              onChange={(zones) => onChange({ ...value, zones })}
              onClose={() => setOpen(null)}
            />
          </div>
        </Popover>
      )}
      {open === 'budget' && (
        <Popover anchorRef={budgetAnchorRef} minWidth={300} maxWidth={360} maxHeight="unset">
          <div ref={popoverRef}>
            <BudgetPopoverBody
              value={value.budget}
              onChange={(budget) => onChange({ ...value, budget })}
              onDone={() => setOpen(null)}
            />
          </div>
        </Popover>
      )}
    </div>
  );
}

function formatBudget(b: NonNullable<ComposerChipsValue['budget']>): string {
  const fmt = new Intl.NumberFormat('es-AR').format(b.amount);
  const symbol = b.currency === 'USD' ? 'USD' : '$';
  return `${symbol} ${fmt}`;
}

/** Serialize the chip selections into a Spanish phrase the agent can extract. */
export function chipsToPrompt(v: ComposerChipsValue): string {
  const parts: string[] = [];
  if (v.zones.length > 0) {
    parts.push(`Quiero buscar en ${v.zones.join(', ')}`);
  }
  if (v.budget) {
    const fmt = new Intl.NumberFormat('es-AR').format(v.budget.amount);
    const cur = v.budget.currency === 'USD' ? 'USD' : '$';
    parts.push(`presupuesto hasta ${cur} ${fmt}`);
  }
  if (v.hasPet) {
    parts.push('tengo mascota');
  }
  return parts.join('. ');
}

// ─── Chip button (active = green-ish accent) ─────────────────────────

interface ChipButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}

function ChipButton({ active, icon, label, onClick, ref }: ChipButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'oklch(0.55 0.17 116 / 0.55)' : 'var(--line)'}`,
        fontSize: 12,
        color: active ? 'var(--acc)' : 'var(--fg-1)',
        background: active ? 'oklch(0.25 0.07 116 / 0.45)' : 'var(--bg-2)',
        cursor: 'pointer',
        transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: active ? 'var(--acc)' : 'var(--fg-2)', display: 'flex' }}>{icon}</span>
      {label}
    </button>
  );
}

// ─── Popover shell ─────────────────────────────────────────────────────
//
// Rendered via React portal in document.body so it escapes ANY ancestor
// stacking context (preset chips with `willChange: transform` were creating
// their own GPU layers and rendering on top of the popovers otherwise).

const POPOVER_BASE: React.CSSProperties = {
  position: 'fixed',
  zIndex: 1000,
  background: 'var(--bg-1)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  boxShadow: '0 20px 50px oklch(0.05 0 0 / 0.7), 0 4px 12px oklch(0.05 0 0 / 0.4)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

interface PopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Minimum width — the popover grows to fit its content beyond this. */
  minWidth?: number;
  /** Hard cap so wide content doesn't push the popover off-screen. */
  maxWidth?: number;
  maxHeight?: number | 'unset';
  children: React.ReactNode;
}

function Popover({ anchorRef, minWidth = 280, maxWidth = 360, maxHeight = 360, children }: PopoverProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const margin = 8;
      const viewportW = window.innerWidth;
      // Width budget capped to viewport (with 24px breathing room).
      const availableWidth = Math.max(minWidth, Math.min(maxWidth, viewportW - 24));
      // Default: align under the chip's left edge.
      let left = rect.left;
      // Clamp on the right.
      if (left + availableWidth > viewportW - 12) left = viewportW - 12 - availableWidth;
      // Clamp on the left.
      if (left < 12) left = 12;
      const top = rect.bottom + margin;
      setPos({ top, left });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, minWidth, maxWidth]);

  if (!mounted || !pos) return null;
  return createPortal(
    <div
      style={{
        ...POPOVER_BASE,
        top: pos.top,
        left: pos.left,
        // `max-content` makes the popover snap to its content's natural width,
        // so labels with letter-spacing/uppercase don't get clipped.
        width: 'max-content',
        minWidth,
        maxWidth,
        maxHeight: maxHeight === 'unset' ? undefined : maxHeight,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── Zones popover body: search + multi-select ─────────────────────────

function ZonesPopoverBody({
  selected, onChange, onClose,
}: { selected: string[]; onChange: (next: string[]) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const norm = (s: string) => s.toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const query = norm(q.trim());
  const matches = query.length === 0
    ? ZONE_OPTIONS
    : ZONE_OPTIONS.filter((z) => norm(z).includes(query));

  function toggle(zone: string) {
    onChange(selected.includes(zone) ? selected.filter((z) => z !== zone) : [...selected, zone]);
  }

  return (
    <>
      <div style={{ padding: 10, borderBottom: '1px solid var(--line)', position: 'relative' }}>
        <Search size={13} strokeWidth={SW} style={{
          position: 'absolute', left: 22, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)',
        }} />
        <input
          autoFocus
          placeholder="Buscar barrio o zona…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-2)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '7px 10px 7px 30px',
            fontSize: 13,
            outline: 'none',
            color: 'var(--fg)',
          }}
        />
      </div>

      {selected.length > 0 && (
        <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {selected.map((z) => (
              <button
                key={z}
                onClick={() => toggle(z)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, color: 'var(--acc)',
                  background: 'oklch(0.25 0.07 116 / 0.45)',
                  border: '1px solid oklch(0.55 0.17 116 / 0.55)',
                  borderRadius: 999, padding: '3px 8px', cursor: 'pointer',
                }}
              >
                {z} <X size={10} strokeWidth={SW} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {matches.map((z) => {
          const on = selected.includes(z);
          return (
            <button
              key={z}
              onClick={() => toggle(z)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '8px 12px',
                background: 'transparent', border: 0, cursor: 'pointer',
                color: on ? 'var(--acc)' : 'var(--fg)', fontSize: 13, textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{z}</span>
              {on && <Check size={13} strokeWidth={SW} />}
            </button>
          );
        })}
        {matches.length === 0 && (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--fg-3)', textAlign: 'center' }}>
            Sin coincidencias.
          </div>
        )}
      </div>

      <div style={{ padding: 8, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          onClick={onClose}
          style={{
            fontSize: 12, color: 'var(--acc-ink)', background: 'var(--acc)',
            border: 0, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 500,
          }}
        >
          Listo
        </button>
      </div>
    </>
  );
}

// ─── Budget popover body ───────────────────────────────────────────────

function BudgetPopoverBody({
  value, onChange, onDone,
}: {
  value: ComposerChipsValue['budget'];
  onChange: (next: ComposerChipsValue['budget']) => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(value?.amount ?? 0);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>(value?.currency ?? 'ARS');

  function commit(next: { amount: number; currency: 'ARS' | 'USD' } | null) {
    onChange(next);
  }

  return (
    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-3)', fontFamily: '"JetBrains Mono", monospace' }}>
        Presupuesto máximo / mes
      </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--fg)',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="ARS">$ ARS</option>
            <option value="USD">USD</option>
          </select>
          <input
            // type="text" with inputMode="numeric" avoids the browser's native
            // up/down spinner buttons (they render with a white background that
            // clashes with the dark theme) while keeping the mobile numeric keypad.
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={amount === 0 ? '' : new Intl.NumberFormat('es-AR').format(amount)}
            placeholder="500.000"
            autoFocus
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '');
              setAmount(digits.length === 0 ? 0 : Number(digits));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (amount > 0) commit({ amount, currency });
                onDone();
              }
            }}
            style={{
              flex: 1,
              background: 'var(--bg-2)', border: '1px solid var(--line)',
              borderRadius: 8, padding: '8px 10px', fontSize: 14, color: 'var(--fg)',
              outline: 'none', fontWeight: 500,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[300_000, 500_000, 700_000, 1_000_000, 1_500_000].map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset)}
              style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 999,
                border: '1px solid var(--line)', background: 'var(--bg-2)',
                color: 'var(--fg-1)', cursor: 'pointer',
              }}
            >
              {new Intl.NumberFormat('es-AR').format(preset)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <button
            onClick={() => { commit(null); setAmount(0); onDone(); }}
            style={{
              fontSize: 11.5, color: 'var(--fg-3)', background: 'transparent', border: 0,
              cursor: 'pointer', padding: '4px 0',
            }}
          >
            Sin tope
          </button>
          <button
            onClick={() => { commit(amount > 0 ? { amount, currency } : null); onDone(); }}
            style={{
              fontSize: 12, color: 'var(--acc-ink)', background: 'var(--acc)',
              border: 0, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 500,
            }}
          >
            Listo
          </button>
        </div>
    </div>
  );
}

