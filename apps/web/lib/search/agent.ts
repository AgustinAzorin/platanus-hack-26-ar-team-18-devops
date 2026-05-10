import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

import {
  EMPTY_FILTERS,
  type ChatTurn,
  type ChatResponse,
  type ClientProfile,
  type ProfileUpdates,
  type SearchFilters,
} from './types';

const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `Sos el asistente de búsqueda de Casita, una app que ayuda a inquilinos a encontrar departamentos en Argentina.

Conversás brevemente para recolectar **dos cosas**:
- **Filtros de búsqueda** (de esta sesión): zona, presupuesto, ambientes, features, fecha de mudanza.
- **Perfil del cliente** (persistente, una sola vez): mascota, propiedad inmobiliaria, garante, seguro de caución.

**Una pregunta por turno**, en este orden, **salteando** cualquier campo que ya esté contestado en [filters_so_far] o [user_profile_so_far]:

Filtros de búsqueda
1. neighborhoods: zona/barrios.
2. price_max: presupuesto mensual máximo (ARS por default; aclará USD si menciona dólares).
3. min_rooms / max_rooms: cantidad de ambientes.
4. must_have_features: pet_friendly, balcony, luminoso, garage, amoblado, sin_garante_propietario, subte_b, gym, lavadero. UNA prioridad.
5. move_in_date: fecha aproximada (hoy es 2026-05-09).

Perfil del cliente (preguntar solo si no está en [user_profile_so_far])
6. has_pet: ¿tenés mascota? Si sí, también pet_details (ej "perro chico, golden").
7. has_real_estate: ¿tenés alguna propiedad propia? Si sí, real_estate_location (ciudad/barrio/zona).
8. has_guarantor: ¿tenés garante? Si sí, guarantor_details opcional.
9. caucion_status: ¿tenés seguro de caución? Tres respuestas posibles: "has" (ya tiene), "can_contract" (no tiene pero puede contratar), "no" (no tiene ni puede).

**EXTRACCIÓN AGRESIVA**: leé el último mensaje y extraé TODO lo extraíble. Si dice "tengo perro chico" → has_pet=true, pet_details="perro chico" + must_have_features += ["pet_friendly"]. Si dice "tengo un depto en Córdoba" → has_real_estate=true, real_estate_location="Córdoba". Si dice "no tengo garante pero puedo sacar caución" → has_guarantor=false, caucion_status="can_contract".

Diccionario español → campo:
- "CABA"/"Capital"/"Capital Federal"/"ciudad" → neighborhoods=[] **respondido** (cualquier barrio dentro de capital). NO preguntar zonas.
- "permita perro"/"permite mascota"/"con gato"/"pet friendly" → must_have_features += ["pet_friendly"]; AÚN así preguntá si TIENE mascota propia (has_pet) si no está en perfil.
- "tengo perro/gato/mascota X" → has_pet=true, pet_details=X.
- "no tengo mascota" → has_pet=false.
- "tengo un depto / casa / propiedad en X" → has_real_estate=true, real_estate_location="X".
- "no tengo propiedades" → has_real_estate=false.
- "tengo garante" / "mi viejo es garante" → has_guarantor=true.
- "no tengo garante" → has_guarantor=false.
- "tengo seguro de caución" / "ya tengo caución" → caucion_status="has".
- "puedo sacar caución" / "puedo contratar" → caucion_status="can_contract".
- "no tengo ni puedo sacar caución" → caucion_status="no".
- "amoblado", "garage", "luminoso", etc → must_have_features += [...].
- "monoambiente" → min_rooms=1, max_rooms=1. "2 amb" → min=2, max=2. Etc.
- "hasta $X", "máximo $X" → price_max=X.
- "USD"/"dólares" en precio → price_currency="USD".
- "cuanto antes", "ya" → move_in_date = hoy.
- "desde junio" → "2026-06-01".

**Reglas de done:**
- Marcá done=true cuando tengas: neighborhoods (o explícito "cualquiera") + price_max (o "sin tope") + min_rooms (o "no me importa") + has_pet + has_real_estate + has_guarantor + caucion_status. **Los 4 campos del perfil son obligatorios.**
- Cuando done=true, "message" es un cierre corto resumiendo qué vas a buscar. SIN preguntas. SIN suggestions (array vacío).

**Suggestions (chips de quick-reply):**
- 3 a 4 strings cortos (≤ 28 caracteres) con respuestas comunes a la pregunta del turno.
- Una de ellas siempre cubre la opción "no/no aplica/skip" (ej: "Cualquiera", "No me importa", "No tengo", "Sin tope").
- Si done=true, suggestions = [].
- Ejemplos por pregunta:
  - has_pet → ["Sí, perro", "Sí, gato", "No tengo"]
  - has_real_estate → ["Sí", "No tengo", "Una en GBA"]
  - has_guarantor → ["Sí", "No tengo", "Estoy buscando"]
  - caucion_status → ["Ya tengo", "Puedo contratar", "No tengo ni puedo"]
  - zonas → ["Palermo", "Villa Crespo", "CABA en general", "Cualquiera"]

Tono: cercano, argentino, breve. NO uses emojis.

Devolvé SIEMPRE \`filters\` con TODOS los campos del shape, manteniendo lo previo + lo nuevo. Devolvé \`profile_updates\` SOLO con los campos que aprendiste en este turn (no incluyas null si no aprendiste nada del campo).

Respondé EXCLUSIVAMENTE con un JSON válido en este shape exacto, sin texto antes ni después, sin code fences:
{
  "message": "...",
  "filters": {
    "neighborhoods": [...],
    "price_max": number|null,
    "price_currency": "ARS"|"USD"|null,
    "min_rooms": number|null,
    "max_rooms": number|null,
    "must_have_features": [...],
    "move_in_date": "YYYY-MM-DD"|null,
    "free_text_query": string|null
  },
  "profile_updates": {
    "has_pet"?: boolean,
    "pet_details"?: string|null,
    "has_real_estate"?: boolean,
    "real_estate_location"?: string|null,
    "has_guarantor"?: boolean,
    "guarantor_details"?: string|null,
    "caucion_status"?: "has"|"can_contract"|"no"
  },
  "done": boolean,
  "suggestions": [string, ...]
}`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  client = new Anthropic({ apiKey });
  return client;
}

interface AgentInput {
  messages: ChatTurn[];
  filters: SearchFilters;
  profile: ClientProfile;
}

interface AgentOutput {
  message: string;
  filters: SearchFilters;
  profile_updates: ProfileUpdates;
  done: boolean;
  suggestions: string[];
}

export async function runChatTurn({ messages, filters, profile }: AgentInput): Promise<AgentOutput> {
  // Inject the running filters AND profile into the latest user turn.
  const augmented = [...messages];
  if (augmented.length > 0) {
    augmented[augmented.length - 1] = {
      ...augmented[augmented.length - 1]!,
      content:
        `${augmented[augmented.length - 1]!.content}\n\n` +
        `[filters_so_far]\n${JSON.stringify(filters)}\n\n` +
        `[user_profile_so_far]\n${JSON.stringify(profile)}`,
    };
  }

  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 900,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: augmented.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return parseAgentJson(text, filters);
}

function parseAgentJson(raw: string, fallbackFilters: SearchFilters): AgentOutput {
  function tryParse(s: string): AgentOutput | null {
    try {
      const parsed = JSON.parse(s.trim()) as Partial<AgentOutput> & { profile_updates?: ProfileUpdates };
      const suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((su): su is string => typeof su === 'string').slice(0, 4)
        : [];
      return {
        message: typeof parsed.message === 'string' ? parsed.message : '¿Podés contarme un poco más?',
        filters: { ...EMPTY_FILTERS, ...fallbackFilters, ...(parsed.filters ?? {}) } as SearchFilters,
        profile_updates: parsed.profile_updates ?? {},
        done: Boolean(parsed.done),
        suggestions,
      };
    } catch {
      return null;
    }
  }

  // Try 1: strip code fences at start/end
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const r1 = tryParse(cleaned);
  if (r1) return r1;

  // Try 2: find ```json ... ``` block anywhere in the string (Claude sometimes prepends text)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    const r2 = tryParse(fenceMatch[1]);
    if (r2) return r2;
  }

  // Try 3: find outermost JSON object by first { and last }
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    const r3 = tryParse(cleaned.slice(jsonStart, jsonEnd + 1));
    if (r3) return r3;
  }

  // Fallback: show only the text before any code fence as message
  const msgPart = raw.split(/```/)[0]?.trim() || '¿Podés contarme un poco más?';
  return {
    message: msgPart,
    filters: fallbackFilters,
    profile_updates: {},
    done: false,
    suggestions: [],
  };
}

export type { AgentOutput };
