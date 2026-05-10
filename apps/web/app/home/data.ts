import { createClient } from '../../lib/supabase/server';

export interface LiveActivityItem {
  id: string;
  accent: 'acc' | 'pos' | 'warm';
  top: string;
  when: string;
  who: string;
  what: string;
}

interface PropiedadRow {
  posting_id: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  location_label: string | null;
  price_value: number | null;
  price_type: string | null;
  square_meters_area: number | null;
  rooms: number | null;
}

const SELECT =
  'posting_id, address, neighborhood, city, location_label, price_value, price_type, square_meters_area, rooms';

const NAMES = ['Soledad', 'Federico', 'Mariana', 'Lucas', 'Cecilia', 'Diego', 'Laura', 'Hernán'];

const TEMPLATES: Array<(p: PropiedadRow, name: string, place: string) => Omit<LiveActivityItem, 'id'>> = [
  (p, name, place) => ({
    accent: 'acc',
    top: 'WhatsApp · saliente',
    when: 'hace 2 min',
    who: `${name} — ${place}`,
    what: `Casita le escribió: "Hola ${name}, vi tu publicación del ${roomsWord(p.rooms)} ¿Sigue disponible para junio?" — esperando respuesta`,
  }),
  (_p, name, place) => ({
    accent: 'pos',
    top: 'RESPONDIÓ · MATCH 92%',
    when: 'hace 11 min',
    who: `${name} — ${place}`,
    what: 'Confirmó disponibilidad y propuso visita el jueves 16hs. Esperando tu OK.',
  }),
  (p, _name, place) => ({
    accent: 'warm',
    top: 'DESCARTADO POR LA IA',
    when: 'hace 22 min',
    who: p.address?.trim() ? p.address : place,
    what: 'Razón: contrafrente, sin luz natural y supera +18% del presupuesto.',
  }),
];

export async function fetchLiveActivity(): Promise<LiveActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('propiedades')
    .select(SELECT)
    .order('scraped_at', { ascending: false })
    .limit(60);

  if (error || !data) {
    console.error('[home] fetchLiveActivity failed', error);
    return [];
  }

  const rows = data as PropiedadRow[];
  const seen = new Set<string>();
  const unique: PropiedadRow[] = [];

  for (const row of rows) {
    const key = (row.neighborhood ?? row.city ?? '').toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= 3) break;
  }

  return unique.map((p, i) => {
    const place = p.neighborhood ?? p.city ?? 'CABA';
    const name = NAMES[i % NAMES.length] ?? 'Soledad';
    const tpl = TEMPLATES[i % TEMPLATES.length]!;
    return { id: p.posting_id, ...tpl(p, name, place) };
  });
}

function roomsWord(rooms: number | null): string {
  if (!rooms || rooms === 1) return 'monoamb.';
  return `${rooms} amb.`;
}
