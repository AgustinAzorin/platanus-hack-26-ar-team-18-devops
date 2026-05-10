import 'server-only';
import { EMPTY_PROFILE, type ClientProfile, type ProfileUpdates } from './types';
import { createServiceClient } from '../supabase/service';
import type { Database } from '../supabase/database';

type UsersUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Mock client id used while there's no real Supabase Auth login. The row was
 * seeded by `apps/web/scripts/sql/002_users_phone_and_seed.sql` (Ezequiel Bourlot).
 * Replace this with `supabase.auth.getUser().id` once auth is wired.
 */
export const MOCK_CLIENT_USER_ID = '11111111-1111-4111-8111-111111111111';

export async function getCurrentClientUserId(): Promise<string> {
  // TODO: read from Supabase Auth cookie when login is implemented.
  return MOCK_CLIENT_USER_ID;
}

export async function loadClientProfile(userId: string): Promise<ClientProfile> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select(
      'has_pet, pet_details, has_real_estate, real_estate_location, has_guarantor, guarantor_details, caucion_status',
    )
    .eq('id', userId)
    .maybeSingle();
  if (!data) return { ...EMPTY_PROFILE };
  return {
    has_pet: data.has_pet ?? null,
    pet_details: data.pet_details ?? null,
    has_real_estate: data.has_real_estate ?? null,
    real_estate_location: data.real_estate_location ?? null,
    has_guarantor: data.has_guarantor ?? null,
    guarantor_details: data.guarantor_details ?? null,
    caucion_status: normalizeCaucion(data.caucion_status),
  };
}

export async function persistProfileUpdates(userId: string, updates: ProfileUpdates): Promise<void> {
  const sanitized = sanitizeUpdates(updates);
  if (Object.keys(sanitized).length === 0) return;
  const supabase = createServiceClient();
  const { error } = await supabase.from('users').update(sanitized).eq('id', userId);
  if (error) console.error('[profile] failed to persist updates:', error);
}

function sanitizeUpdates(u: ProfileUpdates): UsersUpdate {
  const out: UsersUpdate = {};
  if (u.has_pet !== undefined && u.has_pet !== null) out.has_pet = Boolean(u.has_pet);
  if (u.pet_details !== undefined) out.pet_details = u.pet_details;
  if (u.has_real_estate !== undefined && u.has_real_estate !== null) out.has_real_estate = Boolean(u.has_real_estate);
  if (u.real_estate_location !== undefined) out.real_estate_location = u.real_estate_location;
  if (u.has_guarantor !== undefined && u.has_guarantor !== null) out.has_guarantor = Boolean(u.has_guarantor);
  if (u.guarantor_details !== undefined) out.guarantor_details = u.guarantor_details;
  if (u.caucion_status !== undefined) out.caucion_status = normalizeCaucion(u.caucion_status);
  return out;
}

function normalizeCaucion(raw: unknown): 'has' | 'can_contract' | 'no' | null {
  if (raw === 'has' || raw === 'can_contract' || raw === 'no') return raw;
  return null;
}
