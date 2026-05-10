import type { ClientProfile, SearchFilters } from './types';

/**
 * Build a natural-language Spanish query for the backend `/search/query`
 * endpoint, combining the structured filters captured during the Q&A AND the
 * client profile. The backend's `SearchTranslatorService` (Claude) re-parses
 * this back into structured `SearchFilters`, including the must-have features.
 *
 * We deliberately phrase profile fields as *requirements on the listing*
 * (e.g. "que acepte mascotas", "que acepte caución") so the translator picks
 * them up as `must_have_features` or `free_text_query`. The profile values
 * themselves stay in the DB; this query only reflects what the user wants.
 */
export function composeSearchQuery(filters: SearchFilters, profile: ClientProfile): string {
  const parts: string[] = [];

  // Operation: implicit venta (the backend defaults to that and the DB only
  // has venta listings). If we ever support alquiler, derive from filters.
  parts.push('Busco departamento');

  if (filters.neighborhoods.length > 0) {
    parts.push(`en ${filters.neighborhoods.join(', ')}`);
  }

  if (filters.min_rooms !== null && filters.max_rooms !== null && filters.min_rooms === filters.max_rooms) {
    parts.push(`${filters.min_rooms} ambientes`);
  } else if (filters.min_rooms !== null && filters.max_rooms !== null) {
    parts.push(`entre ${filters.min_rooms} y ${filters.max_rooms} ambientes`);
  } else if (filters.min_rooms !== null) {
    parts.push(`al menos ${filters.min_rooms} ambientes`);
  } else if (filters.max_rooms !== null) {
    parts.push(`hasta ${filters.max_rooms} ambientes`);
  }

  if (filters.price_max !== null) {
    const cur = filters.price_currency === 'USD' ? 'USD' : '$';
    parts.push(`hasta ${cur} ${new Intl.NumberFormat('es-AR').format(filters.price_max)}`);
  }

  if (filters.must_have_features.length > 0) {
    parts.push(`con ${filters.must_have_features.map((f) => f.replace(/_/g, ' ')).join(', ')}`);
  }

  if (filters.move_in_date) {
    parts.push(`para mudarme ${filters.move_in_date}`);
  }

  // Profile-driven requirements on the listing:
  if (profile.has_pet === true) {
    parts.push('que acepte mascotas (tengo una)');
  }
  if (profile.has_guarantor === false) {
    parts.push('que acepte sin garante propietario');
  }
  if (profile.caucion_status === 'has' || profile.caucion_status === 'can_contract') {
    parts.push('que acepte seguro de caución');
  }

  if (filters.free_text_query && filters.free_text_query.trim().length > 0) {
    parts.push(filters.free_text_query.trim());
  }

  return parts.join(', ').replace(/\s+,/g, ',') + '.';
}
