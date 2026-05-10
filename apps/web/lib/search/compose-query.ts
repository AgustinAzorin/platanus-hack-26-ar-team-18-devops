import type { ClientProfile, SearchFilters } from './types';

/**
 * Build a natural-language Spanish query for the backend `/search/query`
 * endpoint. Includes ONLY listing-level criteria (zone, price, rooms,
 * features). Profile fields (pet, real estate, guarantor, caución) are NOT
 * filters of the listing — they live on the user row in the DB and inform
 * downstream agent conversations with the seller.
 *
 * The `_profile` parameter is kept for symmetry with the call site and may
 * be used later to enrich the query with optional context if needed.
 */
export function composeSearchQuery(filters: SearchFilters, _profile: ClientProfile): string {
  const parts: string[] = [];

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

  if (filters.free_text_query && filters.free_text_query.trim().length > 0) {
    parts.push(filters.free_text_query.trim());
  }

  return parts.join(', ').replace(/\s+,/g, ',') + '.';
}
