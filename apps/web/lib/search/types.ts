export interface SearchFilters {
  neighborhoods: string[];        // ["Palermo","Villa Crespo"] or [] = no preference
  price_max: number | null;       // monthly rent cap in ARS, null = no cap
  price_currency: 'ARS' | 'USD' | null;
  min_rooms: number | null;       // ambientes
  max_rooms: number | null;
  must_have_features: string[];   // ["pet_friendly","balcony","subte_b"]
  move_in_date: string | null;    // ISO date when answered, null otherwise
  free_text_query: string | null; // anything not captured above
}

export const EMPTY_FILTERS: SearchFilters = {
  neighborhoods: [],
  price_max: null,
  price_currency: null,
  min_rooms: null,
  max_rooms: null,
  must_have_features: [],
  move_in_date: null,
  free_text_query: null,
};

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  /**
   * For user turns: how the content was produced. The agent treats both as
   * regular user input (it MUST see pill clicks in the conversation history,
   * otherwise it re-asks questions the user already answered). The UI uses
   * this flag to filter pill turns out of the visible thread.
   */
  source?: 'typed' | 'pill';
}

export type CaucionStatus = 'has' | 'can_contract' | 'no';

export interface ClientProfile {
  has_pet: boolean | null;
  pet_details: string | null;
  has_real_estate: boolean | null;
  real_estate_location: string | null;
  has_guarantor: boolean | null;
  guarantor_details: string | null;
  caucion_status: CaucionStatus | null;
}

export const EMPTY_PROFILE: ClientProfile = {
  has_pet: null,
  pet_details: null,
  has_real_estate: null,
  real_estate_location: null,
  has_guarantor: null,
  guarantor_details: null,
  caucion_status: null,
};

/** Fields the agent will fill on each turn — partial because most turns only learn one thing. */
export type ProfileUpdates = Partial<ClientProfile>;

export interface ChatRequest {
  messages: ChatTurn[];           // full conversation, including pill clicks (so the agent sees history)
  filters: SearchFilters;         // running collected filters
}

export interface ChatResponse {
  message: string;                // next assistant message (the question, or final summary)
  filters: SearchFilters;         // updated filters extracted from the latest user turn
  profile: ClientProfile;         // current client profile after persisting any updates
  done: boolean;                  // true when filters + required profile are ready
  suggestions: string[];          // 0–4 quick-reply chips. Click sends as a user turn.
}

// ─── Backend /search/query response (mirrors apps/api/src/modules/search/search.types.ts) ───

export interface BackendSearchFilters {
  neighborhoods: string[];
  price_max: number | null;
  price_currency: 'ARS' | 'USD';
  operation_type: 'venta' | 'alquiler';
  must_have_features: string[];
  min_score: number | null;
  min_rooms: number | null;
  max_rooms: number | null;
  free_text_query: string | null;
}

export interface SearchResultItem {
  analysis_id: string;
  url: string;
  address: string | null;
  neighborhood: string | null;
  price_value: number | null;
  price_type: string | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters_area: number | null;
  score: number;
  resumen_ejecutivo: string;
  red_flags: string[];
}

export interface MetaReportRecommendation {
  analysis_id: string;
  razon: string;
}

export interface MetaReport {
  resumen_busqueda: string;
  top_recomendaciones: MetaReportRecommendation[];
  trade_offs: string[];
  alertas: string[];
}

export interface BackendSearchResponse {
  query: string;
  filters: BackendSearchFilters;
  results: SearchResultItem[];
  meta_report: MetaReport | null;
  notice: string | null;
}
