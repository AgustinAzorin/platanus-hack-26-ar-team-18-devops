const COUNTRY_DIAL_CODES: Record<string, string> = {
  AR: '54',
  US: '1',
  CL: '56',
  BR: '55',
  MX: '52',
  ES: '34',
  UY: '598',
};

/**
 * Normalize an arbitrary phone string (as stored in `propiedades.posting_id`) to E.164.
 * Strips spaces, dashes and parentheses; assumes the configured default country
 * when the input does not include a country prefix.
 *
 * Argentine quirk: WhatsApp expects mobile numbers WITHOUT the `9` (e.g. `+541155557777`,
 * not `+5491155557777`). We don't strip it here — Meta accepts both — but flag it for tweaks.
 */
export function toE164(raw: string, defaultCountryIso = 'AR'): string {
  if (!raw) throw new Error('Empty phone number');
  let digits = String(raw).trim().replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) {
    digits = '+' + digits.slice(1).replace(/\D/g, '');
    if (digits.length < 8) throw new Error(`Phone too short: ${raw}`);
    return digits;
  }
  digits = digits.replace(/\D/g, '');
  const dial = COUNTRY_DIAL_CODES[defaultCountryIso.toUpperCase()] ?? '54';
  if (digits.startsWith(dial)) return `+${digits}`;
  return `+${dial}${digits}`;
}

/** WhatsApp returns `wa_id` without the `+`. Mirror that for matching. */
export function toWaId(e164: string): string {
  return e164.replace(/^\+/, '');
}

/**
 * Argentine mobile numbers exist in two WhatsApp formats:
 *   +5491112345678  (11-digit local, with mobile prefix '9')
 *   +541112345678   (10-digit local, without the '9')
 * Returns the alternate form, or null for non-AR numbers.
 */
export function arAltPhone(e164: string): string | null {
  if (e164.startsWith('+549') && e164.length === 14) {
    return '+54' + e164.slice(4);
  }
  if (e164.startsWith('+54') && !e164.startsWith('+549') && e164.length === 13) {
    return '+549' + e164.slice(3);
  }
  return null;
}
